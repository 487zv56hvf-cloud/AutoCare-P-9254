import { View, Text } from "react-native";

/** Egyptian plate look: blue "EGYPT / مصر" band over white with the plate text. */
export function Plate({ text, small }: { text: string; small?: boolean }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        minWidth: small ? 120 : 160,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#1C2A39",
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
    >
      <View style={{ backgroundColor: "#2F7FCF", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ color: "#fff", fontSize: small ? 9 : 11, fontWeight: "800" }}>EGYPT</Text>
        <Text style={{ color: "#fff", fontSize: small ? 9 : 11, fontWeight: "800" }}>مصر</Text>
      </View>
      <Text
        style={{ color: "#111", fontSize: small ? 18 : 22, fontWeight: "800", textAlign: "center", paddingHorizontal: 10, paddingVertical: 4, letterSpacing: 2 }}
      >
        {text}
      </Text>
    </View>
  );
}
