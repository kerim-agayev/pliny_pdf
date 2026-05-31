/**
 * Renders a JSON-LD <script>. Server component — safe to drop into any page.
 * `data` is one schema.org object (or an array of them).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe inside a script tag; no user HTML is injected.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
