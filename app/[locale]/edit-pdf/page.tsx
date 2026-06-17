import { getTranslations, setRequestLocale } from "next-intl/server";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { IconCloudUp, IconFile } from "@/components/shared/icons";

export const generateMetadata = toolMetadata("edit-pdf");

/**
 * Edit PDF â€” the cloud editor (Phase 4). Unlike every other tool it does NOT use
 * ToolShell: the editor is a full-screen takeover (its own header/toolbars/sidebar),
 * so the page just emits SEO/JSON-LD and mounts the client editor full-bleed.
 *
 * Wave 9G LCP fix: the editor is `dynamic(ssr:false)`, so nothing painted
 * server-side and LCP waited ~7.6s for the JS chunk. The static, aria-hidden
 * placeholder below mirrors the editor's empty state and renders in the initial
 * HTML â€” it becomes the LCP element, then is fully covered by the editor's opaque
 * `position:fixed; inset:0; z-index:50` shell once it hydrates. No focusable
 * elements (styled span, not a button) so it adds nothing to the a11y tree.
 */
export default async function EditPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.editPdf");
  return (
    <>
      <JsonLd data={toolSchemas("edit-pdf", locale)} />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          background:
            "radial-gradient(60% 50% at 50% 30%, rgba(107,92,231,0.07), rgba(107,92,231,0) 70%), var(--bg)",
        }}
      >
        <div
          style={{
            width: 620,
            maxWidth: "92%",
            border: "1.5px dashed var(--line-2)",
            borderRadius: 22,
            padding: "64px 48px",
            textAlign: "center",
            background: "linear-gradient(180deg, rgba(127,127,127,0.02), rgba(127,127,127,0))",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 19,
              margin: "0 auto 24px",
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#60A5FA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCloudUp size={32} sw={1.6} />
          </div>
          <h1 style={{ fontSize: 26, letterSpacing: "-0.025em", marginBottom: 10 }}>
            {t("emptyTitle")}
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--text-2)", marginBottom: 8 }}>{t("emptyDesc")}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
            <span className="pp-mono" style={{ fontSize: 11.5, color: "var(--text-2)" }}>
              {t("pdfOnly")}
            </span>
          </div>
          <div>
            <span className="pp-btn pp-btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <IconFile size={15} /> {t("browse")}
            </span>
          </div>
        </div>
      </div>
      <ToolMount component="EditPdf" />
    </>
  );
}
