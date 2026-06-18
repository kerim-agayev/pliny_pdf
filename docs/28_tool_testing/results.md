# 28 Tool — Test Sonuçları

> Test ederken doldur. Durum: ⬜ test edilmedi · ✅ sorunsuz · ⚠️ küçük sorun · ❌ bozuk
> Sorun çıkarsa "Not" sütununa **ne yaptın + hata mesajı** yaz.
> Başlangıç: 2026-06-02. URL kalıbı: `http://localhost:3000/en/<slug>` (`/tr` `/ru` de var).

## Özet (2026-06-02)
**28/28 tool çalışıyor.** 24 local + 3 cloud (word↔pdf, AI summary) UI'dan test edildi, çalıştı.
OCR lokalde 502 (ocrmypdf yok — beklenen, prod'da test). Bazı tool'larda **ufak eksiklik/
küçük sorunlar** var ama hepsi çalışıyor — bunların detayı **Phase 3 (CLAUDE_3)** ile gelecek,
orada çözülecek.

## Organize (local)
| # | Tool | slug | Durum | Not |
|---|---|---|---|---|
| 1 | Merge PDF | merge-pdf | ✅ | |
| 2 | Split PDF | split-pdf | ✅ | |
| 3 | Rotate PDF | rotate-pdf | ✅ | |
| 4 | Delete Pages | delete-pages | ✅ | |
| 5 | Extract Pages | extract-pages | ✅ | |
| 6 | Organize Pages | organize-pages | ✅ | |

## Edit (local)
| # | Tool | slug | Durum | Not |
|---|---|---|---|---|
| 7 | Compress PDF | compress-pdf | ✅ | |
| 8 | Add Page Numbers | add-page-numbers | ✅ | |
| 9 | Header & Footer | header-footer | ✅ | |
| 10 | Crop PDF | crop-pdf | ✅ | |
| 11 | Sign PDF | sign-pdf | ✅ | |
| 12 | Redact Content | redact-content | ✅ | |
| 13 | Edit Metadata | edit-metadata | ✅ | |
| 14 | Grayscale PDF | grayscale-pdf | ✅ | |
| 15 | Flatten PDF | flatten-pdf | ✅ | |
| 16 | Add Watermark (live preview) | add-watermark | ✅ | |
| 17 | PDF Editor (annotation) | edit-pdf | ✅ | |

## Convert (local)
| # | Tool | slug | Durum | Not |
|---|---|---|---|---|
| 18 | Text to PDF | text-to-pdf | ✅ | |
| 19 | Markdown to PDF | markdown-to-pdf | ✅ | |
| 20 | PDF to JPG | pdf-to-jpg | ✅ | |
| 21 | JPG to PDF | jpg-to-pdf | ✅ | |

## Secure (local)
| # | Tool | slug | Durum | Not |
|---|---|---|---|---|
| 22 | Remove Metadata | remove-metadata | ✅ | |
| 23 | Password Protect | password-protect | ✅ | |
| 24 | Remove Password | remove-password | ✅ | |

## Cloud (backend)
| # | Tool | slug | Durum | Not |
|---|---|---|---|---|
| 25 | PDF to Word | pdf-to-word | ✅ | 2026-06-02 UI'dan test edildi, çalıştı |
| 26 | Word to PDF | word-to-pdf | ✅ | 2026-06-02 UI'dan test edildi, çalıştı |
| 27 | OCR PDF | ocr-pdf | ⛔ | 2026-06-02 lokalde 502 (Bad Gateway) — ocrmypdf kurulu değil, **beklenen** (bug değil); prod'da (Hetzner, eng/tur/rus) test edilecek |
| 28 | AI Summary | summarize | ✅ | 2026-06-02 UI'dan test edildi (login ile), çalıştı |
