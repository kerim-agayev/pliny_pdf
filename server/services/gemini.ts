const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const KEY = process.env.GEMINI_API_KEY;
const MAX_CHARS = 100_000;

export type Summary = {
  executive: string;
  outline: string[];
  sections: { title: string; summary: string }[];
};

/** Summarize document text with Gemini Flash. Returns executive / outline / per-section. */
export async function summarize(text: string): Promise<Summary> {
  if (!KEY) throw new Error("GEMINI_API_KEY is not set");

  const clipped = text.slice(0, MAX_CHARS);
  const prompt = `You are an expert summarizer. Summarize the document below.
Respond with JSON ONLY, matching exactly:
{"executive": "a 3-5 sentence executive summary as one string",
 "outline": ["concise bullet point", "..."],
 "sections": [{"title": "section title", "summary": "2-3 sentence summary"}]}
Use at most 8 outline bullets and at most 8 sections. Write in the document's own language.

Document:
"""
${clipped}
"""`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned a non-JSON response");
  }

  const p = parsed as {
    executive?: unknown;
    outline?: unknown;
    sections?: unknown;
  };
  return {
    executive: typeof p.executive === "string" ? p.executive : "",
    outline: Array.isArray(p.outline) ? p.outline.map((x) => String(x)) : [],
    sections: Array.isArray(p.sections)
      ? p.sections.map((s) => {
          const o = s as { title?: unknown; summary?: unknown };
          return { title: String(o.title ?? ""), summary: String(o.summary ?? "") };
        })
      : [],
  };
}
