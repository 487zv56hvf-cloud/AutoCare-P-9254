/**
 * Egyptian plate format check. Private plates are 1–3 Arabic letters plus 1–4 digits
 * (e.g. "ط ح ص ١٢٣٤", "س ط ٥٦٧"). This only checks the format — no public registry
 * exists to confirm a plate belongs to a given car.
 */
const PLATE_LETTERS = "ابجدرسصطعفقلمنهوىي";
const LETTER_FIX: Record<string, string> = { "أ": "ا", "إ": "ا", "آ": "ا", "ي": "ى", "ة": "ه" };
const toArabicDigits = (d: string) => d.replace(/[0-9]/g, (x) => String.fromCharCode(0x0660 + Number(x)));
const toLatin = (d: string) => d.replace(/[٠-٩]/g, (x) => String(x.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (x) => String(x.charCodeAt(0) - 0x06f0));

/** Returns the plate in a standard form ("ط ح ص ١٢٣٤"), or null if it is not a valid Egyptian plate. */
export function normalizePlate(raw: string): string | null {
  const cleaned = toLatin(raw).replace(/[\s\-_|/\\.ـ]/g, "");
  if (!cleaned) return null;
  const letters = [...cleaned.replace(/[0-9]/g, "")].map((c) => LETTER_FIX[c] ?? c);
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (letters.length < 1 || letters.length > 3) return null;
  if (digits.length < 1 || digits.length > 4) return null;
  if (!letters.every((c) => PLATE_LETTERS.includes(c))) return null;
  // Letters and digits must each be one block (either order), not mixed together.
  if (!/^(\D+\d+|\d+\D+)$/.test(cleaned)) return null;
  return `${letters.join(" ")} ${toArabicDigits(digits)}`;
}
