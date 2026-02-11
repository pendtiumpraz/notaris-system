# 🔑 Notaris License Server

License management server untuk Notaris Portal System.  
**Siap deploy ke Vercel** — powered by Next.js + Prisma + PostgreSQL.

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
cd docs/license-server
npm install
```

### 2. Setup Database

Copy `.env.example` ke `.env` dan isi `DATABASE_URL`:

```bash
cp .env.example .env
```

**Rekomendasi database gratis:**

- [Neon](https://neon.tech) — PostgreSQL serverless (free tier)
- [Supabase](https://supabase.com) — PostgreSQL + extras (free tier)
- [Railway](https://railway.app) — PostgreSQL (free trial)

### 3. Migrate Database

```bash
npx prisma migrate dev --name init
```

### 4. Run Locally

```bash
npm run dev   # http://localhost:4000
```

### 5. Login Dashboard

Buka `http://localhost:4000` → login dengan credentials di `.env`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

## 🚀 Deploy ke Vercel

### 1. Push ke GitHub

```bash
cd docs/license-server
git init
git add .
git commit -m "init license server"
git remote add origin https://github.com/your-repo/license-server.git
git push -u origin main
```

### 2. Import di Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository
3. **Root Directory**: `docs/license-server` (jika monorepo)
4. Framework: **Next.js** (otomatis terdeteksi)

### 3. Set Environment Variables di Vercel

| Variable             | Value                                |
| -------------------- | ------------------------------------ |
| `DATABASE_URL`       | Connection string dari Neon/Supabase |
| `API_SECRET`         | Secret key untuk API admin           |
| `ADMIN_USERNAME`     | Username dashboard                   |
| `ADMIN_PASSWORD`     | Password dashboard                   |
| `PIRACY_WEBHOOK_URL` | (Optional) Discord/Telegram webhook  |

### 4. Done!

Dashboard bisa diakses di `https://your-app.vercel.app`

---

## 📋 Fitur

### 🔐 Dashboard Admin

- **Login** — Username/password dari env
- **Stats** — Total license, aktif, bound domain, piracy attempts
- **License Management** — Buat, lihat, nonaktifkan, unbind domain
- **Piracy Monitor** — Lihat semua percobaan pembajakan

### 🔑 License Management

- Generate license key format: `NTRS-XXXX-XXXX-XXXX-XXXX`
- Binding ke domain saat aktivasi
- Paket: `complete`, `no_ai`, `limited_ai`
- Lifetime atau dengan expiry date

### 🚨 Anti-Piracy

- **Domain binding** — License hanya bisa dipakai di 1 domain
- **Piracy detection** — Otomatis deteksi percobaan dari domain lain
- **Logging** — IP, user-agent, domain, timestamp
- **Webhook alerts** — Real-time ke Discord/Telegram
- **Revoke** — Nonaktifkan license yang dibajak

### 📊 Buyer Information

Setiap license menyimpan:

- Nama notaris/PIC
- Nama kantor notaris
- Email, telepon, alamat

---

## 🔌 API Endpoints

### Public (dipanggil oleh client portal):

| Method | URL                      | Description        |
| ------ | ------------------------ | ------------------ |
| `POST` | `/api/licenses/activate` | Aktivasi license   |
| `POST` | `/api/licenses/verify`   | Verifikasi license |

### Admin (butuh auth):

| Method   | URL                        | Description        |
| -------- | -------------------------- | ------------------ |
| `POST`   | `/api/auth`                | Login              |
| `GET`    | `/api/auth`                | Check session      |
| `DELETE` | `/api/auth`                | Logout             |
| `GET`    | `/api/admin/licenses`      | List semua license |
| `POST`   | `/api/admin/licenses`      | Buat license baru  |
| `PATCH`  | `/api/admin/licenses/[id]` | Update license     |
| `DELETE` | `/api/admin/licenses/[id]` | Unbind domain      |
| `GET`    | `/api/admin/stats`         | Dashboard stats    |
| `GET`    | `/api/admin/piracy`        | Piracy logs        |

### Auth Modes:

- **Dashboard**: Cookie-based session (httpOnly)
- **API**: `Authorization: Bearer {API_SECRET}`

---

## 🛠 CLI: Generate License Key

```bash
npm run generate-key -- --package complete --holder "Budi, S.H." --office "Kantor Notaris Budi"
```

Options:
| Flag | Description |
|---|---|
| `--package` | `complete`, `no_ai`, `limited_ai` |
| `--holder` | Nama notaris (required) |
| `--office` | Nama kantor |
| `--email` | Email |
| `--phone` | Telepon |
| `--address` | Alamat |
| `--expires` | Tanggal kedaluwarsa (YYYY-MM-DD) |
| `--count` | Jumlah key yang dibuat |

---

## 📁 Struktur

```
docs/license-server/
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/
│   └── generate-key.ts     # CLI generate key
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/route.ts           # Login/logout
│   │   │   ├── admin/
│   │   │   │   ├── licenses/route.ts   # CRUD licenses
│   │   │   │   ├── licenses/[id]/route.ts
│   │   │   │   ├── stats/route.ts      # Dashboard stats
│   │   │   │   └── piracy/route.ts     # Piracy monitor
│   │   │   └── licenses/
│   │   │       ├── activate/route.ts   # Public: aktivasi
│   │   │       └── verify/route.ts     # Public: verifikasi
│   │   ├── globals.css                 # Dashboard styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Dashboard UI
│   └── lib/
│       ├── auth.ts                     # Auth utilities
│       ├── piracy.ts                   # Webhook + masking
│       └── prisma.ts                   # Prisma client
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```
