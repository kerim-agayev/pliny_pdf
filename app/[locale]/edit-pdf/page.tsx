import { setRequestLocale } from "next-intl/server";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("edit-pdf");

/**
 * Edit PDF — the cloud editor (Phase 4). Unlike every other tool it does NOT use
 * ToolShell: the editor is a full-screen takeover (its own header/toolbars/sidebar),
 * so the page just emits SEO/JSON-LD and mounts the client editor full-bleed.
 */
export default async function EditPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <JsonLd data={toolSchemas("edit-pdf")} />
      <ToolMount component="EditPdf" />
    </>
  );
}
