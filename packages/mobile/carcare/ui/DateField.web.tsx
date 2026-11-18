import { createElement } from "react";
import { Text, View } from "react-native";
import { SERVICE_DATE_MIN } from "../maintenance";
import { s, COLORS } from "./theme";
import type { DateFieldProps } from "./DateField";

/** Browser preview: the browser's own date input (calendar picker, keyboard entry, max = today). */
export function DateField({
  lang,
  rtl,
  label,
  value,
  max,
  onChange,
}: DateFieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.label, { textAlign: rtl ? "right" : "left" }]}>
        {label}
      </Text>
      {createElement("input", {
        type: "date",
        value,
        min: SERVICE_DATE_MIN,
        max,
        lang: lang === "ar" ? "ar-EG" : "en-GB",
        "aria-label": label,
        "data-testid": "service-date",
        onChange: (e: { target: { value: string } }) =>
          onChange(e.target.value),
        style: {
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "11px 12px",
          fontSize: 16,
          fontFamily: "system-ui",
          color: COLORS.text,
          background: COLORS.card,
          direction: rtl ? "rtl" : "ltr",
          minHeight: 48,
          boxSizing: "border-box",
          width: "100%",
          accentColor: COLORS.primary,
        },
      })}
    </View>
  );
}
