/**
 * Build a header-safe `Content-Disposition: attachment` value.
 *
 * HTTP header values must be ASCII, so a filename with non-ASCII characters
 * (e.g. the Turkish dotless ı in "Hakikat_Karnavalı") makes the header invalid
 * and the response throws (a 500). We emit an ASCII-sanitized `filename` for
 * safety plus an RFC 5987 `filename*=UTF-8''…` so capable browsers still get the
 * original Unicode name.
 */
export function attachmentDisposition(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // strip combining marks after NFD (é → e)
    .replace(/[^\x20-\x7e]/g, "_") // any remaining non-ASCII → _
    .replace(/["\\]/g, "_"); // quotes/backslashes would break the quoted-string
  // RFC 5987 ext-value: percent-encode, then also encode the chars that
  // encodeURIComponent leaves intact but aren't valid attr-chars.
  const encoded = encodeURIComponent(name).replace(
    /['()*!]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
