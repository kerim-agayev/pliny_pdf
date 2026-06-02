"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ToolSkeleton } from "./ToolSkeleton";

/**
 * Lazy-loads each tool's interactive client component on demand (Wave 3G-1).
 * Server pages render the SEO shell (ToolShell: heading, how-it-works, related,
 * JSON-LD) immediately and mount the heavy widget here with `ssr: false`, so its
 * JS chunk (pdf-lib / pdfjs / canvas deps) is fetched client-side behind a
 * skeleton instead of shipping with the initial route payload.
 *
 * One central registry; pages reference a tool by its component key. Tools that
 * take props (only CloudConvertTool) receive them via `props`.
 */
const loading = () => <ToolSkeleton />;

const REGISTRY = {
  MergeTool: dynamic(() => import("./MergeTool").then((m) => m.MergeTool), { ssr: false, loading }),
  SplitTool: dynamic(() => import("./SplitTool").then((m) => m.SplitTool), { ssr: false, loading }),
  CompressTool: dynamic(() => import("./CompressTool").then((m) => m.CompressTool), { ssr: false, loading }),
  RotateTool: dynamic(() => import("./RotateTool").then((m) => m.RotateTool), { ssr: false, loading }),
  GrayscalePdf: dynamic(() => import("./GrayscalePdf").then((m) => m.GrayscalePdf), { ssr: false, loading }),
  PdfToJpgTool: dynamic(() => import("./PdfToJpgTool").then((m) => m.PdfToJpgTool), { ssr: false, loading }),
  JpgToPdfTool: dynamic(() => import("./JpgToPdfTool").then((m) => m.JpgToPdfTool), { ssr: false, loading }),
  WatermarkTool: dynamic(() => import("./WatermarkTool").then((m) => m.WatermarkTool), { ssr: false, loading }),
  EditorTool: dynamic(() => import("./EditorTool").then((m) => m.EditorTool), { ssr: false, loading }),
  ProtectTool: dynamic(() => import("./ProtectTool").then((m) => m.ProtectTool), { ssr: false, loading }),
  UnlockTool: dynamic(() => import("./UnlockTool").then((m) => m.UnlockTool), { ssr: false, loading }),
  DeletePages: dynamic(() => import("./DeletePages").then((m) => m.DeletePages), { ssr: false, loading }),
  ExtractPages: dynamic(() => import("./ExtractPages").then((m) => m.ExtractPages), { ssr: false, loading }),
  OrganizePages: dynamic(() => import("./OrganizePages").then((m) => m.OrganizePages), { ssr: false, loading }),
  RemoveMetadata: dynamic(() => import("./RemoveMetadata").then((m) => m.RemoveMetadata), { ssr: false, loading }),
  EditMetadata: dynamic(() => import("./EditMetadata").then((m) => m.EditMetadata), { ssr: false, loading }),
  FlattenPdf: dynamic(() => import("./FlattenPdf").then((m) => m.FlattenPdf), { ssr: false, loading }),
  TextToPdf: dynamic(() => import("./TextToPdf").then((m) => m.TextToPdf), { ssr: false, loading }),
  MarkdownToPdf: dynamic(() => import("./MarkdownToPdf").then((m) => m.MarkdownToPdf), { ssr: false, loading }),
  RedactContent: dynamic(() => import("./RedactContent").then((m) => m.RedactContent), { ssr: false, loading }),
  CropPdf: dynamic(() => import("./CropPdf").then((m) => m.CropPdf), { ssr: false, loading }),
  SignPdf: dynamic(() => import("./SignPdf").then((m) => m.SignPdf), { ssr: false, loading }),
  AddPageNumbers: dynamic(() => import("./AddPageNumbers").then((m) => m.AddPageNumbers), { ssr: false, loading }),
  HeaderFooter: dynamic(() => import("./HeaderFooter").then((m) => m.HeaderFooter), { ssr: false, loading }),
  SummarizeTool: dynamic(() => import("./SummarizeTool").then((m) => m.SummarizeTool), { ssr: false, loading }),
  OcrPdf: dynamic(() => import("./OcrPdf").then((m) => m.OcrPdf), { ssr: false, loading }),
  CloudConvertTool: dynamic(() => import("./CloudConvertTool").then((m) => m.CloudConvertTool), { ssr: false, loading }),
} satisfies Record<string, ComponentType<never>>;

export type ToolKey = keyof typeof REGISTRY;

export function ToolMount({
  component,
  props,
}: {
  component: ToolKey;
  props?: Record<string, unknown>;
}) {
  const C = REGISTRY[component] as ComponentType<Record<string, unknown>>;
  return <C {...(props ?? {})} />;
}
