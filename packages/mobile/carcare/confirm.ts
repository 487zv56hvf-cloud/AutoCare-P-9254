import { Alert, Platform } from "react-native";

/** Alert.alert ignores buttons on web, so fall back to window.alert/confirm there. */
export function notify(message: string): void {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert(message);
}

export function confirm(title: string, message: string, yes: string, no: string, onYes: () => void): void {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: no, style: "cancel" },
    { text: yes, onPress: onYes },
  ]);
}
