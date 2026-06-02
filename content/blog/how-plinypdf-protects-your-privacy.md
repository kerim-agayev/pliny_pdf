---
title: "How PlinyPDF protects your privacy: a technical breakdown"
date: "2026-06-02"
excerpt: "Most PDF tools upload your files to servers you don't control. Here's exactly how PlinyPDF is different — and how to verify it yourself."
readingTime: 6
slug: "how-plinypdf-protects-your-privacy"
---

Most online PDF tools share a quiet assumption: to do anything with your file, they first have to copy it onto their servers. Rotate a page? Upload. Merge two documents? Upload. Add a watermark? Upload. Your contracts, payslips, medical letters, and signed agreements take a round trip through a machine you don't own — for operations that never needed a server in the first place.

PlinyPDF is built on the opposite assumption. This post is the technical breakdown of how that works, why it's safer, and — most importantly — how you can verify the claim yourself in about thirty seconds.

## The problem with most online PDF tools

When you upload a file to a typical PDF service, a few things become true that you can't undo:

- **The file now exists on someone else's disk.** Even with a stated "we delete after an hour" policy, you're trusting a promise. Backups, logs, caches, and crash dumps can all retain copies you'll never see.
- **It crosses a jurisdiction.** Your document may be processed in a country with different rules about lawful access than the one you live in.
- **It can be read in transit by the service itself.** TLS protects the file from outsiders, but the server that terminates the connection sees it in the clear.

None of this is malice — it's just the architecture. If processing happens on a server, the file has to be on that server. The only way to truly avoid the risk is to not send the file at all.

## How browser-side processing works

Modern browsers are powerful enough to do real document processing without any server. PlinyPDF leans on three things:

- **WebAssembly (WASM).** Libraries that used to require a backend now compile to WASM and run inside your browser tab at near-native speed. Parsing a PDF, re-encoding images, rewriting the page tree — all of it happens locally.
- **pdf-lib and pdfjs.** We use `pdf-lib` to read and rewrite PDF structure and Mozilla's `pdfjs` to render pages to a canvas. Both run entirely client-side. When you [merge a PDF](/merge-pdf) or [compress one](/compress-pdf), your file is loaded into memory in your tab, transformed there, and handed straight back to you as a download. Browse the full set on the [tools page](/tools).
- **No network call.** For local tools there is no "upload" step, because there is nothing to upload to. The file's bytes never leave the tab.

The result: 24 of our tools do their entire job — merge, split, rotate, watermark, crop, organize, redact, page numbers, metadata, and more — without your file ever touching our infrastructure. It's not that we promise to delete it quickly; it's that we never receive it.

## Verify it yourself — the DevTools test

You don't have to take our word for any of this. Your browser ships with the exact tool you need to check.

1. Open PlinyPDF and go to a local tool such as [Merge PDF](/merge-pdf).
2. Open your browser's developer tools (`F12`, or right-click → **Inspect**) and click the **Network** tab.
3. Optionally tick **Preserve log** so nothing clears.
4. Now actually use the tool — add a couple of PDFs and merge them, then download the result.
5. Watch the Network tab while it works.

You'll see the page's own assets load, and then — nothing. No request carrying your file to a server. No multi-megabyte `POST` with your document in the body. The merge happened in front of you, in your tab, with zero upload traffic. That empty Network log is the whole privacy claim, made visible.

If you ever run this test on a tool and *do* see your file being uploaded, that tool is a cloud tool — and on PlinyPDF it will say so, plainly, before you use it.

## What about cloud tools?

A few jobs genuinely cannot run in the browser today. Converting a PDF to an editable Word document needs a real office engine (LibreOffice); [AI Summary](/summarize) needs a language model; OCR needs a recognition engine. For these we're honest: the file does go to a server. So we hold those tools to a stricter standard:

- **Clearly labelled.** Every cloud tool wears a blue "Cloud" badge so you always know before you start whether a file will leave your device.
- **Deleted within 24 hours.** Uploaded files and their results are removed from temporary storage automatically — we don't keep a library of your documents.
- **Never used to train models.** Your file is processed to produce *your* result and nothing else. It is not fed into any training pipeline, ours or a third party's.
- **Minimal collection.** We don't attach your documents to an advertising profile. There are no ads on PlinyPDF, and there never will be.

The rule we follow is simple: process in the browser whenever it's technically possible, and use a server only when the job truly requires one — with the trade-off stated up front.

## The privacy promise

Privacy isn't a marketing line you have to believe; on PlinyPDF it's a property of the architecture you can inspect. Local tools can't leak your file because they never receive it, and you can confirm that yourself with the DevTools test above. Cloud tools are few, clearly marked, short-lived, and never used to train anything.

If you want the specifics — what we log, what we don't, and how the cloud tools handle data — they're spelled out in our [Privacy Policy](/privacy). And if you're curious why a PDF toolkit cares this much in the first place, that's the story on our [About page](/about).

Your files are yours. The best way to keep them that way is to never hand them over — so for almost everything PlinyPDF does, you don't.
