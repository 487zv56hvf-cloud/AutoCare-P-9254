import { useState } from "react";
import { View, Text, TouchableOpacity, Image, Modal, Pressable, useWindowDimensions, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type Lang } from "../i18n";
import { s, COLORS } from "./theme";

type Spot = "windshield" | "door" | "engine";

// Relative requires: the "@/" alias does not resolve in Metro for assets.
const PICS: Record<Spot, ImageSourcePropType> = {
  windshield: require("../../assets/vin/windshield.jpg"),
  door: require("../../assets/vin/door.jpg"),
  engine: require("../../assets/vin/engine.jpg"),
};
// Easiest place first.
const SPOTS: Spot[] = ["windshield", "door", "engine"];
const RATIO = 4 / 3; // all pictures are 720x540

/** Numbered step list, RTL aware. */
function Steps({ lang, rtl, spot }: { lang: Lang; rtl: boolean; spot: Spot }) {
  const row = rtl ? "row-reverse" : "row";
  const align = { textAlign: rtl ? "right" : "left" } as const;
  return (
    <View style={{ marginTop: 6, gap: 6 }}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={{ flexDirection: row, alignItems: "flex-start", gap: 8 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 1,
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "800", fontSize: 11 }}>{n}</Text>
          </View>
          <Text style={[s.body, align, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{t(lang, `vinStep_${spot}_${n}`)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Step-by-step picture guide: the places a VIN is usually found on cars sold in Egypt. */
export function VinGuide({ lang, rtl }: { lang: Lang; rtl: boolean }) {
  const { width: screenW } = useWindowDimensions();
  const zoomW = Math.min(screenW, 560) - 36;
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<Spot | null>(null);
  // Explicit sizes: percentage width + aspectRatio is unreliable for images on web.
  const [w, setW] = useState(0);
  const row = rtl ? "row-reverse" : "row";
  const align = { textAlign: rtl ? "right" : "left" } as const;

  return (
    <View style={{ marginTop: 10 }}>
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: row, alignItems: "center", gap: 6, paddingVertical: 6 }}
        testID="vin-guide-toggle"
        accessibilityRole="button"
      >
        <Ionicons name={open ? "chevron-up-circle-outline" : "help-circle-outline"} size={19} color={COLORS.primary} />
        <Text style={[s.linkText, { fontSize: 14 }]}>{t(lang, open ? "vinWhereHide" : "vinWhere")}</Text>
      </TouchableOpacity>

      {open && (
        <View testID="vin-guide" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          <View style={{ backgroundColor: "#EAF5F0", borderRadius: 12, padding: 12, marginTop: 6 }} testID="vin-how">
            <View style={{ flexDirection: row, alignItems: "center", gap: 6 }}>
              <Ionicons name="information-circle" size={18} color={COLORS.primary} />
              <Text style={[s.body, align, { fontWeight: "800", fontSize: 15, color: COLORS.primary }]}>{t(lang, "vinHowTitle")}</Text>
            </View>
            <Text style={[s.body, align, { fontSize: 14, lineHeight: 20, marginTop: 6 }]}>{t(lang, "vinHowIntro")}</Text>
            {["vinTip1", "vinTip2", "vinTip3"].map((k) => (
              <View key={k} style={{ flexDirection: row, alignItems: "flex-start", gap: 6, marginTop: 6 }}>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
                <Text style={[s.body, align, { flex: 1, fontSize: 13, lineHeight: 19 }]}>{t(lang, k)}</Text>
              </View>
            ))}
          </View>

          {SPOTS.map((k, i) => (
            <View
              key={k}
              style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, overflow: "hidden" }}
            >
              <TouchableOpacity onPress={() => setZoom(k)} testID={`vin-spot-${k}`} accessibilityLabel={t(lang, `vinSpot_${k}`)}>
                <View style={{ backgroundColor: "#EEF4F2" }}>
                  {!!w && <Image source={PICS[k]} style={{ width: w - 2, height: Math.round((w - 2) / RATIO) }} resizeMode="cover" />}
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      [rtl ? "right" : "left"]: 8,
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: COLORS.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>{i + 1}</Text>
                  </View>
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      [rtl ? "left" : "right"]: 8,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderRadius: 14,
                      padding: 5,
                    }}
                  >
                    <Ionicons name="expand-outline" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={{ padding: 12 }}>
                <Text style={[s.body, align, { fontSize: 15, fontWeight: "800" }]}>{t(lang, `vinSpot_${k}`)}</Text>
                <Steps lang={lang} rtl={rtl} spot={k} />
              </View>
            </View>
          ))}
          <Text style={[s.hint, align, { marginTop: 10 }]}>{t(lang, "vinTapZoom")}</Text>
        </View>
      )}

      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(10,20,25,0.88)", justifyContent: "center", alignItems: "center", padding: 18 }}
          onPress={() => setZoom(null)}
          testID="vin-zoom"
        >
          {zoom && (
            <View style={{ width: zoomW, backgroundColor: COLORS.card, borderRadius: 16, overflow: "hidden" }}>
              <Image source={PICS[zoom]} style={{ width: zoomW, height: Math.round(zoomW / RATIO) }} resizeMode="contain" />
              <View style={{ padding: 14 }}>
                <Text style={[s.itemTitle, align]}>{t(lang, `vinSpot_${zoom}`)}</Text>
                <Steps lang={lang} rtl={rtl} spot={zoom} />
                <TouchableOpacity style={[s.secondaryBtn, { marginTop: 12 }]} onPress={() => setZoom(null)}>
                  <Text style={s.secondaryBtnText}>{t(lang, "close")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
