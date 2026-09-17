// Deciding which Limitless tournaments belong to a VGC regulation.
//
// The API's `format` field is organiser-set and unreliable - M-C events are routinely tagged
// "CUSTOM" or even "M-B". The tournament NAME is the trustworthy signal ("... REG M-C", "Reg MC",
// "Regulation Set M-C"), so we match on that and only trust `format` as a fallback.

/**
 * Tests whether a tournament belongs to a regulation.
 * Takes a tournament (`{ name, format }`) and a regulation letter pair like 'M-C', returns boolean.
 */
export function isRegulation({ name = '', format = '' }, regulation) {
  const [a, b] = regulation.toUpperCase().split('-'); // 'M','C'
  // Match "M-C", "MC", "M C" as a whole token, optionally preceded by "REG"/"REGULATION [SET]".
  const token = new RegExp(`\\b(?:REG(?:ULATION)?(?:\\s+SET)?\\s+)?${a}[\\s-]?${b}\\b`, 'i');
  if (token.test(name)) return true;
  // Fallback: the format field, when it happens to carry the regulation verbatim (e.g. "M-C").
  return format.trim().toUpperCase() === `${a}-${b}`;
}
