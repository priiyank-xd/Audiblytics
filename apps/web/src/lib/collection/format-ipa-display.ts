/** Normalizes stored IPA for display (wraps without duplicate slashes). */
export function formatIpaDisplay(ipa: string): string {
  const inner = ipa.replaceAll('/', '').trim();
  return inner ? `/${inner}/` : ipa;
}
