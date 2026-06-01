// Shared Unicode font loader for the text-input PDF tools (text-to-pdf,
// markdown-to-pdf). pdf-lib's StandardFonts use WinAnsi (CP1252) encoding and
// throw on any code point outside it — which breaks Turkish (ş/ğ/İ/ı), Cyrillic
// (RU), and pasted typographic characters (smart quotes, em dashes). Noto Sans
// covers Latin + Turkish + Cyrillic, so embedding it (subset) renders all three
// launch locales correctly. Files live in /public/fonts and are fetched once.

const cache = new Map<string, Promise<ArrayBuffer>>();

function loadFont(file: string): Promise<ArrayBuffer> {
  const hit = cache.get(file);
  if (hit) return hit;
  const p = fetch(`/fonts/${file}`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load font ${file} (${res.status})`);
    return res.arrayBuffer();
  });
  cache.set(file, p);
  return p;
}

export const loadRegularFont = () => loadFont("NotoSans-Regular.ttf");
export const loadBoldFont = () => loadFont("NotoSans-Bold.ttf");
export const loadMonoFont = () => loadFont("NotoSansMono-Regular.ttf");
