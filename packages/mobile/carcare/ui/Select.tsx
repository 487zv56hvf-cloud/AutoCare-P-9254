import { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { s, COLORS } from "./theme";

type Props = {
  rtl: boolean;
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  disabledText?: string;
  searchPlaceholder: string;
  emptyText: string;
  cancelText: string;
};

/** Dropdown that opens a searchable full-screen list. Users can only pick from `options`. */
export function Select({
  rtl,
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  disabledText,
  searchPlaceholder,
  emptyText,
  cancelText,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.label, align]}>{label}</Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[s.input, { flexDirection: row, alignItems: "center", justifyContent: "space-between", opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={{ fontSize: 16, color: value ? COLORS.text : COLORS.unknown, flex: 1, textAlign: rtl ? "right" : "left" }}>
          {disabled && disabledText ? disabledText : value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.muted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaProvider>
        <SafeAreaView style={[s.root, { backgroundColor: COLORS.card }]} edges={["top", "left", "right", "bottom"]}>
          <View style={[s.header, { flexDirection: row }]}>
            <Text style={[s.itemTitle, { flex: 1, textAlign: rtl ? "right" : "left" }]}>{label}</Text>
            <TouchableOpacity onPress={close} style={{ padding: 6 }}>
              <Text style={s.linkText}>{cancelText}</Text>
            </TouchableOpacity>
          </View>
          {options.length > 8 && (
            <View style={{ padding: 12 }}>
              <TextInput
                style={[s.input, align]}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.unknown}
                autoCorrect={false}
              />
            </View>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={[s.muted, { textAlign: "center", padding: 24 }]}>{emptyText}</Text>}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item);
                    close();
                  }}
                  style={{
                    flexDirection: row,
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 15,
                    paddingHorizontal: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                    backgroundColor: selected ? "#E8F3EF" : COLORS.card,
                  }}
                >
                  <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: selected ? "700" : "400" }}>{item}</Text>
                  {selected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}
