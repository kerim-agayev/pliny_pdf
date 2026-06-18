# 28 Tool — Local Testing

> Manuel "tek tek 28 tool'u test et" oturumunun kaydı. Bir Phase 1/2/3 sorunu
> çıktığında "bugün ne yaptık, ortam nasıl ayağa kalkıyordu" buradan bakılır.
> İlk açılışta bu dosyayı oku, sonra ilgili oturum log'una in.

## Oturumlar
- [2026-06-02 — Local test ortamı kurulumu + CORS/ratelimit fix](2026-06-02-local-test-setup.md)

## Test sonuçları (tek tek)
- [results.md](results.md) — 28 tool'un tek tek test durumu (test ederken doldurulur)

---

## Hızlı durum (2026-06-02)

**Sonuç: 28/28 tool çalışıyor.** 24 local + 3 cloud (word↔pdf, AI summary) UI'dan test edildi.
OCR lokalde 502 (ocrmypdf yok — beklenen, prod'da test). Bazı tool'larda ufak eksiklik/küçük
sorunlar var ama hepsi çalışıyor → detayları **Phase 3 (CLAUDE_3)** kapsamında ele alınacak.

4 cloud tool için **backend + Docker (OCR hariç)** kararıyla local stack kuruldu:

| Servis | Adres | Notu |
|---|---|---|
| Frontend (Next.js dev) | http://localhost:3000 | `bun run dev` |
| Backend (Elysia) | http://localhost:8080 | `bun run server` |
| Gotenberg (Docker) | :3001 (host) → :3000 (container) | `docker compose up -d`, container `pliny_pdf-gotenberg-1` |

- Frontend → **local backend**'e bağlı (`NEXT_PUBLIC_API_URL=http://localhost:8080`).
  ⚠️ `.env.local` bu test için localhost'a çevrildi — **commit etme**, deploy öncesi
  satır 7-8'i Hetzner IP'sine geri al.
- **OCR (`ocr-pdf`)** bu kurulumda yok (ocrmypdf kurulmadı) → lokalde `conversionFailed`
  verir, **beklenen**. Prod'da (Hetzner) test edilecek.

## Ortamı yeniden ayağa kaldırma (sıfırdan)
```powershell
# 1. Docker Desktop'ı aç (daemon), sonra:
cd c:\Users\user\Desktop\pdf_project\pliny_pdf
docker compose up -d            # Gotenberg (:3001)
# 2. .env.local satır 7-8: NEXT_PUBLIC_API_URL = http://localhost:8080 olmalı
# 3. iki ayrı terminal:
bun run server                  # backend :8080
bun run dev                     # frontend :3000
```
Sağlık kontrolü: `curl http://localhost:8080/api/health` → `{"ok":true,...}`,
`http://localhost:3001/health` → 200.

## Bilinen tuzaklar (bu oturumda yaşandı → bkz. 2026-06-02 log)
1. **CORS "Failed to fetch"** — frontend prod Hetzner backend'e bakıyorsa olur;
   Hetzner CORS sadece `plinypdf.com`'a izin verir. Çözüm: local backend + API_URL→localhost.
2. **429 rateLimited** — anonim "local" IP kotası (3/gün) + Upstash Ratelimit'in
   **bellek-içi cache**'i. Reset = Redis key sil **+ backend restart** (ikisi birden).
