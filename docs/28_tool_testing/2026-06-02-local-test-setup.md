# 2026-06-02 — Local test ortamı kurulumu

Amaç: 28 tool'u lokalde tek tek manuel test edebilmek için ortamı ayağa kaldırmak.

## Başlangıç durumu (tespit)
| Kontrol | Sonuç |
|---|---|
| Bun 1.3.13 / Node 24 | ✅ kurulu |
| Docker daemon | ❌ kapalıydı (Docker Desktop açık değildi) |
| Hetzner prod backend (49.13.119.27:8080) | ✅ canlı (`{"ok":true}`) |
| `ocrmypdf` (local OCR) | ❌ kurulu değil |
| Gotenberg image (local) | container `pliny_pdf-gotenberg-1` aslında vardı, daemon açılınca geri geldi |
| Gemini API key | ✅ `.env.local`'de var |
| `NEXT_PUBLIC_API_URL` | ⚠️ **prod Hetzner IP'sine** bakıyordu, localhost değil |

## Kullanıcı kararları
1. Cloud tool test yöntemi: önce "Hetzner prod'a bağlı kalsın (hızlı)" seçildi —
   ama CORS nedeniyle çalışmadı (aşağıya bak), sonra:
2. Kurulum kapsamı: **"Backend + Docker (OCR hariç)"** seçildi.

## Yapılanlar (sırayla)
1. `.env.local` satır 7-8: `NEXT_PUBLIC_API_URL` → `http://localhost:8080` çevrildi
   (prod IP satırı yorum olarak bırakıldı).
2. Docker Desktop başlatıldı → daemon geldi.
3. `docker compose up -d` → Gotenberg `pliny_pdf-gotenberg-1` ayakta (:3001, HTTP 200).
   Container içinde LibreOffice 26.2 (`/usr/bin/soffice`) doğrulandı.
4. `bun run server` → Elysia backend :8080 (`{"ok":true,"service":"plinypdf-backend"}`).
5. `bun run dev` → Next.js 16.2.6 :3000 (yeni API_URL'i alması için restart edildi).
6. word-to-pdf + pdf-to-word **gerçek dosyalarla uçtan uca doğrulandı** (aşağıda).

## Karşılaşılan sorunlar ve çözümleri

### Sorun 1 — CORS "Failed to fetch" (kullanıcı raporladı)
PDF→Word denemesinde:
`Access to fetch at 'http://49.13.119.27:8080/...' from origin 'http://localhost:3000'
blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.

**Sebep:** Frontend prod Hetzner backend'e bakıyordu. Hetzner'in `FRONTEND_ORIGIN` env'i
`https://plinypdf.com` → `localhost:3000`'e CORS izni yok (`server/index.ts:19`,
`cors({ origin: FRONTEND_ORIGIN })`).
**Çözüm:** Local backend'i ayağa kaldır + `NEXT_PUBLIC_API_URL`→localhost. Local backend'in
`FRONTEND_ORIGIN` default'u zaten `http://localhost:3000` (`server/index.ts:16`).

### Sorun 2 — 429 rateLimited (test sırasında çıktı)
İlk uçtan uca testte iki endpoint de `429 {"error":"rateLimited"}` döndü; ACAO doğruydu
yani CORS çözülmüştü, istek backend'e ulaşıyordu.

**Sebep (iki katman):**
- Anonim istekler IP bazlı limitleniyor. Lokalde `x-forwarded-for` yok → `clientIp`
  `"local"` sabitine düşüyor (`server/routes/convert.ts:18`). Limit: **3/gün**
  (`lib/ratelimit.ts:12`, `pp:ip:server` prefix). Önceki dev testlerinden dolmuştu.
- Key silindikten sonra HÂLÂ 429 (2ms'de) → `@upstash/ratelimit`'in **bellek-içi
  ephemeral cache**'i bloklanan identifier'ı Redis'e sormadan reddediyor.

**Çözüm:** Redis key sil **+ backend restart** (ikisi birden gerekli):
```ts
// Upstash: silinen key'ler
pp:ip:server:local:20605, pp:ip:server:local:20606   // gün-bucket'ları
```
Restart sonrası bellek cache temizlendi → test 200 döndü.
(Not: bu, prod OCR reset prosedürünün lokal karşılığı — Upstash temizliği + servis restart.)

## Doğrulama sonuçları (uçtan uca, gerçek dosya)
Container'ın LibreOffice'iyle geçerli `.docx`/`.pdf` üretilip backend'e `fetch` ile gönderildi:

| Endpoint | Sonuç |
|---|---|
| `POST /api/convert/word-to-pdf` | ✅ 200, `application/pdf`, 14981 byte, 2.4s, ACAO=localhost:3000 |
| `POST /api/convert/pdf-to-word` | ✅ 200, `.docx`, 5914 byte, 1.4s, ACAO=localhost:3000 |

Test sonrası anonim kota tekrar sıfırlandı + backend restart → kullanıcıya temiz 3/gün bırakıldı.
(curl Windows sürümü git-bash `/tmp` yolunu okuyamadığından `http=000` veriyordu; doğrulama
`bun` + `fetch` ile yapıldı — uygulamanın kullandığı yolun aynısı.)

## Bugün test edilecekler (birazdan)
- 24 local tool → tarayıcıda tek tek (limitsiz).
- word-to-pdf / pdf-to-word → çalışıyor; anonim 3/gün, daha fazlası için login (10/gün).
- summarize → **login şart** (anonim 401). AI limiti 2/ay; dolarsa AI sayacı reset edilecek.
- ocr-pdf → lokalde YOK (ocrmypdf kurulmadı), `conversionFailed` beklenir; prod'da test.

Tool tool sonuçlar: bkz. [results.md](results.md).
