import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { t, formatNumber, type Lang } from "../i18n";
import {
  SERVICE_NOTE_MAX,
  today,
  toNumber,
  validServiceDate,
  type ItemKey,
  type ServiceEntry,
} from "../maintenance";
import { DateField } from "./DateField";
import { s, COLORS } from "./theme";

type Props = {
  lang: Lang;
  rtl: boolean;
  item: ItemKey | null;
  odometer: number;
  onSave: (item: ItemKey, entry: ServiceEntry) => void;
  onClose: () => void;
};

/** Bottom sheet for recording a completed service: date, odometer and optional description. */
export function ServiceSheet(props: Props) {
  return (
    <Modal
      visible={!!props.item}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      {/* A Modal is its own native window: it needs its own provider for safe-area insets. */}
      <SafeAreaProvider>
        {props.item && <Sheet {...props} item={props.item} />}
      </SafeAreaProvider>
    </Modal>
  );
}

function Sheet({
  lang,
  rtl,
  item,
  odometer,
  onSave,
  onClose,
}: Props & { item: ItemKey }) {
  const insets = useSafeAreaInsets();
  const now = today();
  const [date, setDate] = useState(now);
  const [km, setKm] = useState(String(odometer));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";

  function save() {
    const n = toNumber(km);
    if (!validServiceDate(date, now))
      return setError(t(lang, "serviceDateInvalid"));
    if (n === null || n < 0 || n > odometer)
      return setError(
        t(lang, "serviceKmInvalid", { n: formatNumber(lang, odometer) }),
      );
    if (note.trim().length > SERVICE_NOTE_MAX)
      return setError(
        t(lang, "serviceNoteLong", { n: String(SERVICE_NOTE_MAX) }),
      );
    onSave(item, { date, km: n, note: note.trim() || undefined });
  }

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(21,44,62,0.45)",
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={onClose}
        accessibilityLabel={t(lang, "cancel")}
      />
      <View
        style={{
          backgroundColor: COLORS.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "90%",
        }}
        testID="service-sheet"
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: row,
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={[s.itemTitle, align, { flex: 1 }]}>
              {t(lang, "recordServiceTitle", { item: t(lang, item) })}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel={t(lang, "close")}
              style={{ padding: 6 }}
            >
              <Ionicons name="close" size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
          <Text style={[s.muted, align, { marginBottom: 16 }]}>
            {t(lang, "recordServiceHint")}
          </Text>

          <DateField
            lang={lang}
            rtl={rtl}
            label={t(lang, "serviceDate")}
            value={date}
            max={now}
            onChange={(d) => {
              setDate(d);
              setError("");
            }}
          />

          <Text style={[s.label, align]}>{t(lang, "serviceKm")}</Text>
          <TextInput
            style={[s.input, align]}
            value={km}
            onChangeText={(v) => {
              setKm(v);
              setError("");
            }}
            keyboardType="number-pad"
            accessibilityLabel={t(lang, "serviceKm")}
            testID="service-km"
          />
          <Text style={[s.hint, align, { marginBottom: 14 }]}>
            {t(lang, "serviceKmHint", { n: formatNumber(lang, odometer) })}
          </Text>

          <Text style={[s.label, align]}>{t(lang, "serviceNote")}</Text>
          <TextInput
            style={[
              s.input,
              align,
              { minHeight: 84, textAlignVertical: "top" },
            ]}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={SERVICE_NOTE_MAX}
            placeholder={t(lang, "serviceNotePlaceholder")}
            placeholderTextColor={COLORS.unknown}
            accessibilityLabel={t(lang, "serviceNote")}
            testID="service-note"
          />
          <Text style={[s.hint, align, { marginBottom: 14 }]}>
            {t(lang, "charsLeft", {
              n: formatNumber(lang, SERVICE_NOTE_MAX - note.length),
            })}
          </Text>

          {!!error && (
            <Text
              style={[
                align,
                { color: COLORS.overdue, marginBottom: 12, fontSize: 14 },
              ]}
              accessibilityRole="alert"
            >
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={save}
            testID="service-save"
          >
            <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
            <Text style={[s.primaryBtnText, { marginHorizontal: 6 }]}>
              {t(lang, "saveService")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.linkBtn} onPress={onClose}>
            <Text style={s.linkText}>{t(lang, "cancel")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
