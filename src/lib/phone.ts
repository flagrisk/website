// Nigerian phone normalization. Copied exactly from the app's CreateAccountScreen
// (which says the same rules live in the database's normalize_phone and in the
// Termii SMS hook). All of these MUST agree, or a number created as +234814...
// cannot be signed into as 0814...
export function normalizePhone(raw: string, cc = "234"): string {
  let d = (raw || "").replace(/[^0-9]/g, "");
  if (!d) return "";
  if (d.startsWith("234")) {
    /* already international */
  } else if (d.startsWith("0")) {
    d = cc + d.slice(1);
  } else if (d.length === 10) {
    d = cc + d;
  }
  return "+" + d;
}

export function isValidNaijaPhone(raw: string): boolean {
  return normalizePhone(raw).length >= 11;
}
