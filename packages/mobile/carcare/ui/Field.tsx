import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { s, COLORS } from "./theme";

type FieldProps = {
  rtl: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  hint?: string;
};

export function Field({ rtl, label, value, onChange, numeric, hint }: FieldProps) {
  const align = { textAlign: rtl ? "right" : "left" } as const;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.label, align]}>{label}</Text>
      <TextInput
        style={[s.input, align]}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "number-pad" : "default"}
        placeholderTextColor={COLORS.unknown}
        accessibilityLabel={label}
      />
      {!!hint && <Text style={[s.hint, align]}>{hint}</Text>}
    </View>
  );
}

type ChipsProps<T extends string> = {
  rtl: boolean;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
};

export function Chips<T extends string>({ rtl, value, onChange, options }: ChipsProps<T>) {
  return (
    <View style={{ flexDirection: rtl ? "row-reverse" : "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {options.map(([key, label]) => {
        const active = key === value;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={[s.chip, active && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
          >
            <Text style={[s.chipText, active && { color: "#fff" }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
