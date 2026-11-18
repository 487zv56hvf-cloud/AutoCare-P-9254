import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient, captureToken } from "../../lib/auth";
import { client, orpc } from "../../lib/api";
import { t, type Lang } from "../i18n";
import type { Vehicle } from "../maintenance";
import { normalizePlate } from "../plate";
import { notify, confirm } from "../confirm";
import { isDismissed, toVehicle } from "../cloud";
import { Plate } from "./Plate";
import { Inbox } from "./Inbox";
import { LegalLinks } from "./LegalLinks";
import { s, COLORS } from "./theme";

export type BackupStatus = "idle" | "saving" | "ok" | "failed";

type Props = {
  embedded?: boolean;
  lang: Lang;
  rtl: boolean;
  vehicles: Vehicle[];
  backup: BackupStatus;
  onRetryBackup: () => void;
  onSignOut: () => Promise<void>;
  /** Permanently deletes the account and its data (App Store 5.1.1(v)). */
  onDeleteAccount: () => Promise<void>;
  /** Adds a backed-up car to this phone (or selects it if it is already here). */
  onRestore: (v: Vehicle) => void;
  onClose: () => void;
  /** Signed in on this phone but the session could not be checked (offline / server down). */
  unconfirmed?: boolean;
  onRetrySession?: () => void;
};

type CloudCar = { id: string; title: string; vehicle: Record<string, unknown> };

export function Account({
  embedded,
  lang,
  rtl,
  vehicles,
  backup,
  onRetryBackup,
  onSignOut,
  onDeleteAccount,
  onRestore,
  onClose,
  unconfirmed,
  onRetrySession,
}: Props) {
  const { data: session, isPending } = authClient.useSession();
  const [inbox, setInbox] = useState(false);
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";

  if (inbox && session)
    return <Inbox lang={lang} rtl={rtl} onBack={() => setInbox(false)} />;

  return (
    <SafeAreaView
      edges={embedded ? [] : ["top", "bottom", "left", "right"]}
      style={[s.root, { backgroundColor: COLORS.card }]}
    >
      <View style={[s.header, { flexDirection: row }]}>
        <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
          <Ionicons
            name="person-circle-outline"
            size={24}
            color={COLORS.primary}
          />
          <Text style={[s.title, { fontSize: 20 }]}>
            {t(lang, "accountTitle")}
          </Text>
        </View>
        {!embedded && (
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel={t(lang, "close")}
            style={{ padding: 6 }}
          >
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.root}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {isPending ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginTop: 30 }}
            />
          ) : session ? (
            <SignedIn
              lang={lang}
              rtl={rtl}
              email={session.user.email}
              vehicles={vehicles}
              backup={backup}
              onRetryBackup={onRetryBackup}
              onSignOut={onSignOut}
              onDeleteAccount={onDeleteAccount}
              onInbox={() => setInbox(true)}
              onRestore={(v) => {
                onRestore(v);
                onClose();
              }}
            />
          ) : unconfirmed ? (
            <View style={s.card}>
              <Text style={[s.body, align]}>{t(lang, "sessionError")}</Text>
              <TouchableOpacity
                style={s.linkBtn}
                onPress={onRetrySession}
                testID="session-retry"
              >
                <Text style={s.linkText}>{t(lang, "tryAgain")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SignedOut lang={lang} rtl={rtl} />
          )}
          <Text style={[s.disclaimer, align, { marginHorizontal: 4 }]}>
            {t(lang, "restoreOnlyOwn")}
          </Text>
          <LegalLinks lang={lang} rtl={rtl} card={false} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SignedOut({ lang, rtl }: { lang: Lang; rtl: boolean }) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "apple" | "email" | null>(null);
  const [error, setError] = useState("");
  const align = { textAlign: rtl ? "right" : "left" } as const;

  async function social(provider: "google" | "apple") {
    setError("");
    setBusy(provider);
    try {
      const r = await authClient.managedAuth.signIn({ provider });
      if (r.error && !isDismissed(r.error.code))
        setError(t(lang, "authFailed"));
    } catch {
      setError(t(lang, "authFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function withEmail() {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      return setError(t(lang, "badEmail"));
    if (password.length < 8) return setError(t(lang, "shortPassword"));
    setError("");
    setBusy("email");
    try {
      const opts = { fetchOptions: { onSuccess: captureToken } };
      const r =
        mode === "signUp"
          ? await authClient.signUp.email(
              { email: e, password, name: e.split("@")[0] },
              opts.fetchOptions,
            )
          : await authClient.signIn.email(
              { email: e, password },
              opts.fetchOptions,
            );
      if (r.error) {
        const code = r.error.code ?? "";
        if (code === "USE_GOOGLE") setError(t(lang, "useGoogle"));
        else if (code.includes("ALREADY_EXISTS"))
          setError(t(lang, "emailTaken"));
        else if (code.includes("INVALID")) setError(t(lang, "wrongLogin"));
        else if (code.includes("PASSWORD")) setError(t(lang, "shortPassword"));
        else setError(t(lang, "authFailed"));
        return;
      }
      // Token is now stored; make sure the reactive session picks it up.
      authClient.$store.notify("$sessionSignal");
    } catch {
      setError(t(lang, "restoreError"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <View style={s.card}>
        <Text style={[s.body, align, { lineHeight: 23 }]}>
          {t(lang, "accountWhy")}
        </Text>
        <Text style={[s.muted, align, { marginTop: 6 }]}>
          {t(lang, "accountRequired")}
        </Text>

        {/* Apple's guidelines: black button, white Apple logo, shown at least as prominently as Google. */}
        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 14, backgroundColor: "#000" }]}
          onPress={() => social("apple")}
          disabled={!!busy}
          testID="apple-btn"
        >
          {busy === "apple" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="logo-apple" size={20} color="#fff" />
          )}
          <Text style={s.primaryBtnText}>{t(lang, "continueApple")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.secondaryBtn,
            {
              marginTop: 10,
              borderColor: COLORS.border,
              backgroundColor: "#fff",
            },
          ]}
          onPress={() => social("google")}
          disabled={!!busy}
          testID="google-btn"
        >
          {busy === "google" ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Ionicons name="logo-google" size={18} color="#DB4437" />
          )}
          <Text style={[s.secondaryBtnText, { color: COLORS.text }]}>
            {t(lang, "continueGoogle")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={[s.itemTitle, align, { marginBottom: 10, fontSize: 16 }]}>
          {t(lang, "orEmail")}
        </Text>
        <Text style={[s.label, align]}>{t(lang, "emailLabel")}</Text>
        <TextInput
          style={[s.input, { textAlign: "left" }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="name@example.com"
          placeholderTextColor={COLORS.unknown}
          testID="email-input"
        />
        <Text style={[s.label, align, { marginTop: 12 }]}>
          {t(lang, "passwordLabel")}
        </Text>
        <TextInput
          style={[s.input, { textAlign: "left" }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          testID="password-input"
          onSubmitEditing={withEmail}
        />
        {!!error && (
          <Text
            style={[s.hint, align, { color: COLORS.overdue, fontSize: 13 }]}
          >
            {error}
          </Text>
        )}
        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 14 }]}
          onPress={withEmail}
          disabled={!!busy}
          testID="email-submit"
        >
          {busy === "email" && <ActivityIndicator color="#fff" />}
          <Text style={s.primaryBtnText}>{t(lang, mode)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.linkBtn}
          onPress={() => {
            setError("");
            setMode(mode === "signIn" ? "signUp" : "signIn");
          }}
        >
          <Text style={s.linkText}>
            {t(lang, mode === "signIn" ? "noAccount" : "haveAccount")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

type SignedInProps = {
  lang: Lang;
  rtl: boolean;
  email: string;
  vehicles: Vehicle[];
  backup: BackupStatus;
  onRetryBackup: () => void;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onRestore: (v: Vehicle) => void;
  onInbox: () => void;
};

function SignedIn({
  lang,
  rtl,
  email,
  vehicles,
  backup,
  onRetryBackup,
  onSignOut,
  onDeleteAccount,
  onRestore,
  onInbox,
}: SignedInProps) {
  const [deleting, setDeleting] = useState(false);
  const [plate, setPlate] = useState("");
  const [busy, setBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const cars = useQuery(orpc.backup.list.queryOptions());
  const me = useQuery(orpc.owner.me.queryOptions());
  const counts = useQuery({
    ...orpc.owner.counts.queryOptions(),
    enabled: !!me.data?.isOwner,
  });
  const qc = useQueryClient();
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";

  function askDelete() {
    confirm(
      t(lang, "deleteAccount"),
      t(lang, "deleteAccountConfirm"),
      t(lang, "deleteAccountYes"),
      t(lang, "cancel"),
      () => {
        setDeleting(true);
        void onDeleteAccount()
          .then(() => {
            qc.clear();
            notify(t(lang, "deleteAccountDone"));
          })
          .catch(() => {
            setDeleting(false);
            notify(t(lang, "deleteAccountFailed"));
          });
      },
    );
  }

  function apply(car: CloudCar) {
    const v = toVehicle(car.id, car.vehicle);
    if (!v) return setMsg({ text: t(lang, "restoreError"), bad: true });
    onRestore(v);
    notify(t(lang, "restored"));
  }

  async function findPlate() {
    const p = normalizePlate(plate);
    if (!p) return setMsg({ text: t(lang, "invalidPlate"), bad: true });
    setMsg(null);
    setBusy(true);
    try {
      const car = await client.backup.findByPlate({ plate: p });
      if (!car) setMsg({ text: t(lang, "restoreNotFound"), bad: true });
      else apply(car);
    } catch {
      setMsg({ text: t(lang, "restoreError"), bad: true });
    } finally {
      setBusy(false);
    }
  }

  const status = !vehicles.length
    ? {
        icon: "car-outline" as const,
        color: COLORS.muted,
        text: t(lang, "backupNone"),
      }
    : backup === "failed"
      ? {
          icon: "cloud-offline-outline" as const,
          color: COLORS.overdue,
          text: t(lang, "backupFailed"),
        }
      : backup === "ok"
        ? {
            icon: "cloud-done-outline" as const,
            color: COLORS.ok,
            text: t(lang, "backupOn"),
          }
        : {
            icon: "cloud-upload-outline" as const,
            color: COLORS.muted,
            text: t(lang, "backupSaving"),
          };

  // Backed-up cars that are not on this phone (same id or same plate = already here).
  const here = new Set(
    vehicles
      .flatMap((v) => [
        v.id ?? "",
        v.plate ? (normalizePlate(v.plate) ?? "") : "",
      ])
      .filter(Boolean),
  );
  const others = (cars.data ?? []).filter((c) => {
    const p =
      typeof c.vehicle.plate === "string"
        ? normalizePlate(c.vehicle.plate)
        : null;
    return !here.has(c.id) && !(p && here.has(p));
  });
  const newFeedback = counts.data?.newFeedback ?? 0;

  return (
    <>
      <View style={s.card}>
        <Text
          style={[s.body, align, { fontWeight: "700" }]}
          testID="signed-in-as"
        >
          {t(lang, "signedInAs", { e: email })}
        </Text>
        <View
          style={{
            flexDirection: row,
            alignItems: "center",
            gap: 8,
            marginTop: 10,
          }}
        >
          <Ionicons name={status.icon} size={20} color={status.color} />
          <Text
            style={[
              s.muted,
              align,
              { flex: 1, color: status.color, marginTop: 0 },
            ]}
            testID="backup-status"
          >
            {status.text}
          </Text>
          {vehicles.length > 0 && backup === "failed" && (
            <TouchableOpacity
              onPress={onRetryBackup}
              testID="backup-retry"
              style={{ paddingVertical: 4, paddingHorizontal: 8 }}
            >
              <Text style={[s.linkText, { color: COLORS.primary }]}>
                {t(lang, "tryAgain")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.linkBtn, { paddingBottom: 0 }]}
          onPress={() => {
            setLogoutBusy(true);
            void onSignOut()
              .then(() => qc.clear())
              .catch(() => notify(t(lang, "backupFailed")))
              .finally(() => setLogoutBusy(false));
          }}
          disabled={logoutBusy}
          testID="sign-out"
        >
          <Text style={[s.linkText, { color: COLORS.overdue }]}>
            {t(lang, "signOut")}
          </Text>
        </TouchableOpacity>
      </View>

      {me.data?.isOwner && (
        <TouchableOpacity
          style={[
            s.card,
            {
              flexDirection: row,
              alignItems: "center",
              gap: 12,
              borderColor: COLORS.primary,
              borderWidth: 1.5,
            },
          ]}
          onPress={onInbox}
          testID="inbox-btn"
        >
          <Ionicons
            name="file-tray-full-outline"
            size={24}
            color={COLORS.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.itemTitle, align, { fontSize: 16 }]}>
              {t(lang, "inboxBtn")}
            </Text>
            <Text style={[s.muted, align]}>{t(lang, "inboxBtnHint")}</Text>
          </View>
          {newFeedback > 0 && (
            <View
              style={[
                s.badge,
                {
                  backgroundColor: COLORS.due,
                  minWidth: 26,
                  alignItems: "center",
                },
              ]}
              testID="inbox-badge"
            >
              <Text style={s.badgeText}>
                {newFeedback > 99 ? "99+" : newFeedback}
              </Text>
            </View>
          )}
          <Ionicons
            name={rtl ? "chevron-back" : "chevron-forward"}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}

      <View style={s.card}>
        <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
          <Ionicons
            name="cloud-download-outline"
            size={22}
            color={COLORS.primary}
          />
          <Text style={s.itemTitle}>{t(lang, "restoreTitle")}</Text>
        </View>
        <Text style={[s.muted, align, { marginTop: 6, marginBottom: 10 }]}>
          {t(lang, "restoreHint")}
        </Text>
        <View style={{ flexDirection: row, gap: 10 }}>
          <TextInput
            style={[s.input, { flex: 1, minWidth: 0, textAlign: "right" }]}
            value={plate}
            onChangeText={setPlate}
            placeholder={t(lang, "platePlaceholder")}
            placeholderTextColor={COLORS.unknown}
            onSubmitEditing={findPlate}
            testID="restore-plate"
          />
          <TouchableOpacity
            style={[s.primaryBtn, { paddingHorizontal: 18 }]}
            onPress={findPlate}
            disabled={busy}
            testID="restore-btn"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>{t(lang, "restoreBtn")}</Text>
            )}
          </TouchableOpacity>
        </View>
        {!!msg && (
          <Text
            style={[
              s.hint,
              align,
              { color: msg.bad ? COLORS.overdue : COLORS.ok, fontSize: 13 },
            ]}
          >
            {msg.text}
          </Text>
        )}
      </View>

      {others.length > 0 && (
        <View style={s.card}>
          <Text style={[s.label, align, { marginBottom: 10 }]}>
            {t(lang, "yourCars")}
          </Text>
          {others.map((c) => {
            const p =
              typeof c.vehicle.plate === "string" ? c.vehicle.plate : "";
            return (
              <TouchableOpacity
                key={c.id}
                style={{
                  flexDirection: row,
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border,
                }}
                onPress={() => apply(c)}
                testID="cloud-car"
              >
                <Ionicons
                  name="car-sport-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={[s.body, align, { flex: 1, fontWeight: "600" }]}>
                  {c.title}
                </Text>
                {!!p && <Plate text={p} small />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={[s.card, { borderColor: "#EFD2CD" }]}>
        <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
          <Ionicons name="trash-outline" size={21} color={COLORS.overdue} />
          <Text style={[s.itemTitle, align]}>{t(lang, "deleteAccount")}</Text>
        </View>
        <Text style={[s.muted, align, { marginTop: 6, lineHeight: 21 }]}>
          {t(lang, "deleteAccountInfo")}
        </Text>
        <Text style={[s.hint, align, { lineHeight: 19 }]}>
          {t(lang, "deleteAccountApple")}
        </Text>
        <TouchableOpacity
          style={[
            s.secondaryBtn,
            { marginTop: 12, borderColor: COLORS.overdue },
            deleting && { opacity: 0.6 },
          ]}
          onPress={askDelete}
          disabled={deleting}
          accessibilityRole="button"
          testID="delete-account"
        >
          {deleting ? (
            <ActivityIndicator color={COLORS.overdue} />
          ) : (
            <Text style={[s.secondaryBtnText, { color: COLORS.overdue }]}>
              {t(lang, "deleteAccount")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}
