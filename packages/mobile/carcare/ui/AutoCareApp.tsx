import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  AppState,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import { AppHeader } from "./AppHeader";
import { Login } from "./Login";
import { Cars } from "./Cars";
import { Settings } from "./Settings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { t, type Lang } from "../i18n";
import { loadState, saveState, clearAccountExtras } from "../storage";
import type { Vehicle } from "../maintenance";
import { normalizePlate } from "../plate";
import { confirm } from "../confirm";
import {
  loadReminderPreference,
  saveReminderPreference,
  enableReminderPermission,
  syncReminders,
  supportsReminders,
  loadOdoFrequency,
  saveOdoFrequency,
} from "../notifications";
import { DEFAULT_ODO_FREQUENCY, type OdoFrequency } from "../odometer-reminders";
import type { ReminderStatus } from "./Reminders";
import { Setup } from "./Setup";

// Keep the native splash up until the saved cars are read, so the first frame is the real
// screen instead of a blank one or a spinner. Safety timeout: never hold it longer than 3 s.
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});
  setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 3000);
}
import { Dashboard } from "./Dashboard";
import { Support } from "./Support";
import { Feedback } from "./Feedback";
import { Account, type BackupStatus } from "./Account";
import { backupVehicle, toVehicle, vehicleTitle, withId } from "../cloud";
import { client } from "../../lib/api";
import { authClient, getToken, setToken, signOut } from "../../lib/auth";
import { reconcileCars, carSignature as keyOf } from "../reconcile";
import { s, COLORS } from "./theme";

/** Every car kept in state has an id (used for the active car and its cloud backup row). */
type Car = Vehicle & { id: string };
const ensureId = (v: Vehicle) => withId(v) as Car;
const plateOf = (v: Vehicle) => (v.plate ? normalizePlate(v.plate) : null);
export function AutoCareApp() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>("off");
  const [reminderRefresh, setReminderRefresh] = useState(0);
  const [odoFreq, setOdoFreq] = useState<OdoFrequency>(DEFAULT_ODO_FREQUENCY);
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<Lang>("ar");
  const [cars, setCars] = useState<Car[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Ids deleted on this phone whose cloud copy still has to be removed (retried until it works).
  const [removed, setRemoved] = useState<string[]>([]);
  const [screen, setScreen] = useState<
    "cars" | "setup" | "dashboard" | "account" | "settings"
  >("cars");
  const [adding, setAdding] = useState(false);
  const [support, setSupport] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [setupKey, setSetupKey] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [cloudError, setCloudError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [cloudRefresh, setCloudRefresh] = useState(0);
  const reconciledUser = useRef<string | null>(null);
  const [backup, setBackup] = useState<BackupStatus>("idle");
  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
    refetch: refetchSession,
  } = authClient.useSession();
  const userId = session?.user.id ?? null;
  // Which account the cars on this phone belong to. null = made while signed out.
  const [owner, setOwner] = useState<string | null>(null);
  const signingOut = useRef(false);
  const currentUser = useRef<string | null>(null);
  currentUser.current = userId;
  // Last version of each car the server confirmed, so only changed cars are uploaded.
  const savedRef = useRef<Record<string, string>>({});
  const carsRef = useRef<Car[]>([]);
  carsRef.current = cars;
  const removedRef = useRef<string[]>([]);
  removedRef.current = removed;
  // Bumped to re-run the backup effect (auto-retry, app back in foreground, "Try again").
  const [retry, setRetry] = useState(0);
  const attempts = useRef(0);
  const lastSig = useRef("");

  // Fast open: a returning user (cars saved for their account + sign-in token on this phone)
  // sees their cars straight away while the session is checked, and also when offline.
  // Cloud sync still waits for the confirmed session; a signed-out/expired session shows Login.
  const optimistic =
    !userId &&
    (sessionPending || !!sessionError) &&
    ready &&
    !!owner &&
    !signingOut.current &&
    !!getToken();
  // No sign-in token on the phone means signed out: show Login without waiting for the server.
  // (Web keeps waiting, since a returning Google redirect stores its token asynchronously.)
  const knownSignedOut =
    Platform.OS !== "web" && sessionPending && ready && !owner && !getToken();
  const loading =
    !ready ||
    leaving ||
    (sessionPending && !optimistic && !knownSignedOut) ||
    (!!userId &&
      (owner !== userId || (restoring && cars.length === 0)) &&
      !signingOut.current);
  useEffect(() => {
    if (ready && Platform.OS !== "web")
      SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  const rtl = lang === "ar";
  const active = cars.find((c) => c.id === activeId) ?? cars[0] ?? null;

  useEffect(() => {
    (async () => {
      // Both reads are local; run them together so the first screen is not delayed.
      const [reminders, saved, odo] = await Promise.all([
        loadReminderPreference().catch(() => false),
        loadState(),
        loadOdoFrequency().catch(() => DEFAULT_ODO_FREQUENCY),
      ]);
      setRemindersEnabled(reminders);
      setOdoFreq(odo);
      if (saved) {
        if (saved.lang) setLang(saved.lang);
        setCars(saved.vehicles as Car[]);
        setActiveId(saved.activeId);
        setOwner(saved.owner);
        savedRef.current = saved.synced ?? {};
        setRemoved(saved.removed);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready)
      saveState({
        lang,
        vehicles: cars,
        activeId: active?.id ?? null,
        owner,
        removed,
        synced: savedRef.current,
      });
  }, [lang, cars, active?.id, owner, removed, ready, backup]);

  useEffect(() => {
    if (!ready || sessionPending) return;
    let current = true;
    const allowed = !!userId && owner === userId && !signingOut.current;
    syncReminders(allowed ? cars : [], lang, allowed && remindersEnabled, odoFreq)
      .then((status) => {
        if (current) setReminderStatus(status);
      })
      .catch(() => {
        if (current) setReminderStatus("error");
      });
    return () => {
      current = false;
    };
  }, [
    ready,
    sessionPending,
    userId,
    owner,
    cars,
    lang,
    remindersEnabled,
    odoFreq,
    reminderRefresh,
    leaving,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setReminderRefresh((n) => n + 1);
        reconciledUser.current = null;
        setCloudRefresh((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, []);

  async function toggleReminders() {
    if (!supportsReminders) return;
    try {
      const next = !remindersEnabled;
      if (next && !(await enableReminderPermission())) {
        setReminderStatus("denied");
        return;
      }
      // Reconcile immediately; preference is stored only after scheduling succeeds.
      const status = await syncReminders(cars, lang, next, odoFreq);
      await saveReminderPreference(next);
      setRemindersEnabled(next);
      setReminderStatus(status);
    } catch {
      setReminderStatus("error");
    }
  }

  function changeOdoFrequency(f: OdoFrequency) {
    setOdoFreq(f); // the reminder effect reschedules with the new choice
    saveOdoFrequency(f).catch(() => undefined);
  }

  function resetPhone() {
    savedRef.current = {};
    setCars([]);
    setActiveId(null);
    setRemoved([]);
    setAdding(false);
    setScreen("cars");
    setSetupKey((k) => k + 1);
  }

  // Each account only sees its own cars. When a different account signs in, the previous
  // account's cars leave this phone and the new account's backed-up cars load.
  // Cars made while signed out join the account that signs in.
  useEffect(() => {
    if (!userId) {
      signingOut.current = false;
      reconciledUser.current = null;
    }
    if (
      !ready ||
      sessionPending ||
      !userId ||
      reconciledUser.current === userId ||
      signingOut.current
    )
      return;
    reconciledUser.current = userId;
    const switched = owner !== null && owner !== userId;
    setRestoring(true);
    setCloudError(false);
    setOwner(userId);
    if (switched) resetPhone();
    const forUser = userId;
    client.backup
      .list()
      .then((rows) => {
        // Ignore the answer if a different account is signed in by now.
        if (currentUser.current !== forUser) return;
        const cloud = rows
          .map((r) => toVehicle(r.id, r.vehicle))
          .filter((v): v is Car => !!v);
        const next = reconcileCars(
          carsRef.current,
          cloud,
          removedRef.current,
          forUser,
          savedRef.current,
        );
        setCars(next);
        setActiveId((a) =>
          next.some((c) => c.id === a) ? a : (next[0]?.id ?? null),
        );
        if (!next.length) setScreen("cars");
      })
      .catch(() => {
        if (currentUser.current === forUser) setCloudError(true);
        // Keep local cars; account backup can be retried once online.
      })
      .finally(() => {
        if (currentUser.current === forUser) setRestoring(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sessionPending, userId, owner, cloudRefresh]);

  useEffect(() => {
    if (!userId && !sessionPending && !optimistic) {
      setSupport(false);
      setFeedback(false);
      setScreen("cars");
      setRestoring(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionPending]);

  // Signing out takes the account's cars off this phone (they stay safe in the account).
  async function handleSignOut() {
    signingOut.current = true;
    setLeaving(true);
    try {
      if (userId && owner === userId) {
        for (const id of removed) await client.backup.remove({ id });
        for (const c of cars) {
          if (savedRef.current[c.id] !== keyOf(userId, c))
            await backupVehicle(c);
        }
      }
      await signOut();
      setOwner(null);
      resetPhone();
    } finally {
      signingOut.current = false;
      setLeaving(false);
    }
  }

  // App Store 5.1.1(v): permanently delete the account and its data, then clear this phone.
  async function handleDeleteAccount() {
    signingOut.current = true;
    setLeaving(true);
    try {
      await client.account.delete();
      await syncReminders([], lang, false).catch(() => undefined);
      await clearAccountExtras();
      // The server already ended the session; clear the local token even if sign-out fails.
      await signOut().catch(() => {
        setToken("");
        authClient.$store.notify("$sessionSignal");
      });
      setOwner(null);
      resetPhone();
    } finally {
      signingOut.current = false;
      setLeaving(false);
    }
  }

  // Signed in: back up every changed car shortly after a change (debounced) and send pending deletes.
  // Signed out: phone only.
  useEffect(() => {
    if (
      !ready ||
      !userId ||
      owner !== userId ||
      restoring ||
      signingOut.current
    ) {
      setBackup("idle");
      return;
    }
    const dirty = cars.filter(
      (c) => savedRef.current[c.id] !== keyOf(userId, c),
    );
    const toRemove = removed;
    if (!dirty.length && !toRemove.length) {
      setBackup(cars.length ? "ok" : "idle");
      return;
    }
    const sig = `${dirty.map((c) => keyOf(userId, c)).join("|")}#${toRemove.join(",")}`;
    if (sig !== lastSig.current) {
      lastSig.current = sig;
      attempts.current = 0;
    }
    setBackup("saving");
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      try {
        for (const id of toRemove) {
          await client.backup.remove({ id });
          if (cancelled || currentUser.current !== userId) return;
        }
        if (toRemove.length)
          setRemoved((r) => r.filter((x) => !toRemove.includes(x)));
        for (const c of dirty) {
          const r = await backupVehicle(c);
          if (cancelled || currentUser.current !== userId) return;
          if (r.id === c.id) {
            savedRef.current[c.id] = keyOf(userId, c);
            continue;
          }
          // Same plate already backed up under another id (e.g. re-added on a new phone): adopt that id.
          const moved = { ...c, id: r.id };
          savedRef.current[r.id] = keyOf(userId, moved);
          setCars((cur) =>
            cur
              .filter((x) => x.id !== r.id)
              .map((x) => (x.id === c.id ? { ...x, id: r.id } : x)),
          );
          setActiveId((a) => (a === c.id ? r.id : a));
        }
        attempts.current = 0;
        if (!cancelled) setBackup("ok");
      } catch {
        if (cancelled) return;
        // Network/server hiccups are usually brief: retry quietly a few times before showing an error.
        const waits = [3000, 8000, 20000];
        const wait = waits[attempts.current];
        attempts.current += 1;
        if (wait !== undefined)
          retryTimer = setTimeout(() => setRetry((n) => n + 1), wait);
        else setBackup("failed");
      }
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [cars, removed, userId, owner, ready, retry, restoring, leaving]);

  // Coming back to the app after a failed backup: try again.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active" && backup === "failed") {
        attempts.current = 0;
        setRetry((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, [backup]);

  const retryBackup = () => {
    attempts.current = 0;
    setRetry((n) => n + 1);
    reconciledUser.current = null;
    setCloudRefresh((n) => n + 1);
  };

  const updateActive = (updater: (v: Vehicle) => Vehicle) => {
    const id = active?.id;
    if (!id) return;
    setCars((cur) => cur.map((c) => (c.id === id ? { ...updater(c), id } : c)));
  };

  function saveCar(v: Vehicle) {
    const car = ensureId(v);
    setCars((cur) =>
      cur.some((c) => c.id === car.id)
        ? cur.map((c) => (c.id === car.id ? car : c))
        : [...cur, car],
    );
    setActiveId(car.id);
    setAdding(false);
    setScreen("dashboard");
  }

  /** A car from the account backup: select it if it is already here, otherwise add it. */
  function addFromCloud(v: Vehicle) {
    const car = ensureId(v);
    const p = plateOf(car);
    const here = cars.find((c) => c.id === car.id || (!!p && plateOf(c) === p));
    if (here) {
      setActiveId(here.id);
    } else {
      if (userId) savedRef.current[car.id] = keyOf(userId, car);
      setRemoved((r) => r.filter((x) => x !== car.id));
      setCars((cur) => [...cur, car]);
      setActiveId(car.id);
    }
    setAdding(false);
    setScreen("dashboard");
  }

  function deleteCar(car: Car) {
    // While the session is still being confirmed (or offline) the cars belong to the saved owner.
    const account = userId ?? (optimistic ? owner : null);
    const inCloud = !!account && owner === account;
    confirm(
      t(lang, "deleteCar"),
      t(lang, inCloud ? "deleteCarMsgCloud" : "deleteCarMsg", {
        car: vehicleTitle(car) || car.plate || t(lang, "appName"),
      }),
      t(lang, "delete"),
      t(lang, "cancel"),
      () => {
        const rest = carsRef.current.filter((c) => c.id !== car.id);
        delete savedRef.current[car.id];
        if (inCloud)
          setRemoved((r) => (r.includes(car.id) ? r : [...r, car.id]));
        setCars(rest);
        setActiveId(rest[0]?.id ?? null);
        if (!rest.length) {
          setScreen("cars");
          setSetupKey((k) => k + 1);
        }
      },
    );
  }

  function startAdd() {
    setAdding(true);
    setSetupKey((k) => k + 1);
    setScreen("setup");
  }

  // Spinner only when there is nothing useful to show yet: first sign-in on this phone or an
  // account switch. Returning users keep their cars on screen while the cloud refresh runs.
  // Saved cars are read in a few ms: show a plain background meanwhile, not a spinner flash.
  if (!ready) return <View style={s.root} />;
  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!userId && !optimistic)
    return (
      <Login
        lang={lang}
        onLanguage={() => setLang(rtl ? "en" : "ar")}
        error={!!sessionError}
        onRetry={() => void refetchSession()}
      />
    );

  const otherPlates = cars
    .filter((c) => adding || c.id !== active?.id)
    .map(plateOf)
    .filter((p): p is string => !!p);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[s.root, { backgroundColor: COLORS.card }]}
    >
      <AppHeader lang={lang} onLanguage={() => setLang(rtl ? "en" : "ar")} />

      {(screen === "dashboard" || screen === "setup") && (
        <TouchableOpacity
          onPress={() => {
            setAdding(false);
            setScreen("cars");
          }}
          testID="back-to-cars"
          style={{
            flexDirection: rtl ? "row-reverse" : "row",
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: COLORS.bg,
          }}
        >
          <Ionicons
            name={rtl ? "arrow-forward" : "arrow-back"}
            size={18}
            color={COLORS.primary}
          />
          <Text style={s.linkText}>{t(lang, "allCars")}</Text>
        </TouchableOpacity>
      )}

      <View style={s.root}>
        {screen === "cars" && (
          <Cars
            failed={cloudError}
            onRetry={retryBackup}
            lang={lang}
            cars={cars}
            onPick={(id) => {
              setActiveId(id);
              setScreen("dashboard");
            }}
            onAdd={startAdd}
          />
        )}
        {screen === "settings" && (
          <Settings
            lang={lang}
            onLanguage={() => setLang(rtl ? "en" : "ar")}
            enabled={remindersEnabled}
            status={reminderStatus}
            onToggle={toggleReminders}
            odo={odoFreq}
            onOdo={changeOdoFrequency}
            onHelp={() => setSupport(true)}
            onFeedback={() => setFeedback(true)}
          />
        )}
        {screen === "account" && (
          <Account
            embedded
            lang={lang}
            rtl={rtl}
            vehicles={cars}
            backup={backup}
            onRetryBackup={retryBackup}
            onSignOut={handleSignOut}
            onDeleteAccount={handleDeleteAccount}
            onRestore={addFromCloud}
            onClose={() => setScreen("cars")}
            unconfirmed={optimistic && !!sessionError}
            onRetrySession={() => void refetchSession()}
          />
        )}
        {screen === "setup" && (
          <Setup
            key={setupKey}
            lang={lang}
            rtl={rtl}
            initial={adding ? null : active}
            adding={adding && cars.length > 0}
            otherPlates={otherPlates}
            onRestore={cars.length ? undefined : () => setScreen("account")}
            onCancel={
              cars.length
                ? () => {
                    setAdding(false);
                    setScreen("dashboard");
                  }
                : undefined
            }
            onSave={saveCar}
          />
        )}
        {screen === "dashboard" && active && (
          <Dashboard
            key={active.id}
            lang={lang}
            rtl={rtl}
            vehicle={active}
            setVehicle={updateActive}
            onEdit={() => {
              setAdding(false);
              setSetupKey((k) => k + 1); // fresh form seeded from the active car
              setScreen("setup");
            }}
            onDelete={() => deleteCar(active)}
            remindersEnabled={remindersEnabled}
            reminderStatus={reminderStatus}
            onToggleReminders={toggleReminders}
          />
        )}
      </View>

      <Modal
        visible={support}
        animationType="slide"
        onRequestClose={() => setSupport(false)}
      >
        {/* A Modal is its own native window: it needs its own provider to get the iPhone notch/status-bar insets. */}
        <SafeAreaProvider>
          {support && (
            <Support
              lang={lang}
              rtl={rtl}
              car={carSummary(active)}
              onClose={() => setSupport(false)}
            />
          )}
        </SafeAreaProvider>
      </Modal>

      <Modal
        visible={feedback}
        animationType="slide"
        onRequestClose={() => setFeedback(false)}
      >
        <SafeAreaProvider>
          {feedback && (
            <Feedback
              lang={lang}
              rtl={rtl}
              car={carSummary(active)}
              email={session?.user.email ?? null}
              onClose={() => setFeedback(false)}
            />
          )}
        </SafeAreaProvider>
      </Modal>

      <View
        style={{
          flexDirection: rtl ? "row-reverse" : "row",
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderColor: COLORS.border,
          paddingBottom: 6,
          paddingTop: 6,
        }}
        testID="bottom-nav"
      >
        {(
          [
            { key: "cars", label: "myCars", icon: "car-sport-outline" },
            { key: "account", label: "account", icon: "person-outline" },
            { key: "settings", label: "settings", icon: "options-outline" },
          ] as const
        ).map((tab) => {
          const selected =
            screen === tab.key ||
            (tab.key === "cars" &&
              (screen === "setup" || screen === "dashboard"));
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setScreen(tab.key)}
              testID={`nav-${tab.key}`}
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                minHeight: 54,
              }}
            >
              <Ionicons
                name={tab.icon}
                size={21}
                color={selected ? COLORS.primary : COLORS.muted}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: selected ? "700" : "500",
                  color: selected ? COLORS.primary : COLORS.muted,
                }}
              >
                {t(lang, tab.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/** Short car description the support assistant and feedback can use for context. */
function carSummary(v: Vehicle | null): string | undefined {
  if (!v) return undefined;
  const parts = [
    vehicleTitle(v),
    v.engine,
    v.engineType,
    `${v.odometer} km`,
    v.cls === "ev" ? "" : `${v.oilType} oil`,
  ];
  return parts.filter(Boolean).join(", ").slice(0, 200);
}
