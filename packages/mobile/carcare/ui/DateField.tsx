import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, type Lang } from "../i18n";
import { SERVICE_DATE_MIN } from "../maintenance";
import { s, COLORS } from "./theme";

export type DateFieldProps = {
  lang: Lang;
  rtl: boolean;
  label: string;
  /** YYYY-MM-DD */
  value: string;
  /** YYYY-MM-DD, latest selectable day */
  max: string;
  onChange: (ymd: string) => void;
};

export const toDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const toYmd = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Native date picker: Android opens the system dialog, iOS shows an inline calendar on demand. */
export function DateField({
  lang,
  rtl,
  label,
  value,
  max,
  onChange,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const pick = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: "date",
        maximumDate: toDate(max),
        minimumDate: toDate(SERVICE_DATE_MIN),
        onChange: (e, d) => {
          if (e.type === "set" && d) onChange(toYmd(d));
        },
      });
    } else setOpen((o) => !o);
  };
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.label, align]}>{label}</Text>
      <TouchableOpacity
        onPress={pick}
        style={[
          s.input,
          {
            flexDirection: rtl ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID="service-date"
      >
        <Text style={[s.body, { fontSize: 16 }]}>
          {formatDate(lang, value)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      {open && Platform.OS === "ios" && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display="inline"
          locale={lang === "ar" ? "ar-EG" : "en-GB"}
          maximumDate={toDate(max)}
          minimumDate={toDate(SERVICE_DATE_MIN)}
          accentColor={COLORS.primary}
          onChange={(_, d) => {
            if (d) onChange(toYmd(d));
          }}
        />
      )}
    </View>
  );
}
