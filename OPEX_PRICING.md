# 📊 OPEX & Pricing - Sistem Portal Klien Notaris

> **Dokumen Kalkulasi Biaya Operasional dan Struktur Harga**
> Disusun: 9 Desember 2025 | Harga VPS berdasarkan Domainesia.com

---

## 🎯 Ringkasan Eksekutif

| Model                   | Harga                             |
| ----------------------- | --------------------------------- |
| **SaaS (Subscription)** | Rp 1.500.000 - Rp 4.000.000/bulan |
| **License (One-Time)**  | Rp 25.000.000 - Rp 75.000.000     |
| **OPEX Infrastruktur**  | Rp 350.000 - Rp 900.000/bulan     |

---

## 🔄 Model Bisnis: SaaS vs License

### 📱 Model SaaS (Software as a Service)

**Konsep:** Notaris bayar bulanan, kita yang urus semuanya.

| Paket            | Harga/Bulan  | Termasuk                                      |
| ---------------- | ------------ | --------------------------------------------- |
| **Starter**      | Rp 1.500.000 | 2 Super User, 100 Klien, 15GB                 |
| **Professional** | Rp 2.500.000 | 5 Super User, 500 Klien, 45GB                 |
| **Enterprise**   | Rp 4.000.000 | Unlimited Super User & Klien, Custom branding |

**Keuntungan SaaS:**

- ✅ Recurring revenue (pendapatan bulanan tetap)
- ✅ Semua di-manage kita (VPS, DB, backup)
- ✅ Update & maintenance otomatis
- ✅ Barrier to entry rendah untuk notaris

**Margin SaaS:**
| Paket | Harga Jual | OPEX | Profit/Klien |
|-------|------------|------|--------------|
| Starter | Rp 1.500.000 | Rp 150.000* | **Rp 1.350.000** |
| Professional | Rp 2.500.000 | Rp 200.000* | **Rp 2.300.000** |
| Enterprise | Rp 4.000.000 | Rp 300.000\* | **Rp 3.700.000** |

_\*OPEX per klien jika hosting 10+ klien di satu server_

---

### 📜 Model License (One-Time Purchase)

**Konsep:** Notaris beli putus, hosting sendiri atau beli terpisah.

| Tier             | Harga License | Termasuk                                        |
| ---------------- | ------------- | ----------------------------------------------- |
| **Basic**        | Rp 25.000.000 | Source code, 1 domain, 3 bulan support          |
| **Professional** | Rp 45.000.000 | + Unlimited domain, 6 bulan support, training   |
| **Enterprise**   | Rp 75.000.000 | + White-label, 12 bulan support, custom feature |

**Biaya Tambahan License:**
| Item | Harga |
|------|-------|
| Maintenance Tahunan | Rp 5.000.000/tahun (setelah masa support) |
| Hosting (by us) | Rp 750.000/bulan |
| Setup & Instalasi | Rp 2.500.000 (one-time) |
| Training (4 jam) | Rp 1.000.000 |
| Custom Feature | Rp 2.000.000 - 10.000.000/fitur |

**Proyeksi License + Hosting:**

```
Tahun 1:
  License Professional    Rp 45.000.000
  Hosting 12 bulan       Rp  9.000.000
  Setup                  Rp  2.500.000
  ─────────────────────────────────────
  Total                  Rp 56.500.000

Tahun 2+:
  Maintenance            Rp  5.000.000
  Hosting 12 bulan       Rp  9.000.000
  ─────────────────────────────────────
  Total                  Rp 14.000.000/tahun
```

---

### ⚖️ Perbandingan SaaS vs License

| Aspek                  | SaaS                   | License                         |
| ---------------------- | ---------------------- | ------------------------------- |
| **Modal awal notaris** | Rendah (Rp 1.5jt)      | Tinggi (Rp 25-75jt)             |
| **Pendapatan kita**    | Recurring bulanan      | Lump sum + maintenance          |
| **Revenue 3 tahun**    | Rp 54jt+ per klien     | Rp 56.5jt + Rp 28jt = Rp 84.5jt |
| **Control notaris**    | Rendah                 | Tinggi (punya source)           |
| **Risiko churn**       | Ada                    | Tidak ada                       |
| **Target market**      | Notaris kecil-menengah | Notaris besar, multi-cabang     |

---

## 📦 Fitur Sistem yang Termasuk

### Core Features

- ✅ Multi-role User Management (Super User, Client)
- ✅ Document Management dengan Google Drive Integration
- ✅ Appointment Scheduling System
- ✅ Real-time Messaging
- ✅ Notification System (Email, Push)
- ✅ Audit Logging & Security
- ✅ CMS (FAQ, Testimonial, Team, Gallery)
- ✅ Branch Management (Multi-cabang)

### Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Auth**: NextAuth.js
- **Storage**: Google Drive Integration (FREE!)

---

## 💰 Breakdown OPEX Bulanan (Harga Real Domainesia)

### Harga VPS Domainesia (Promo 50% OFF)

| Spesifikasi                   | Harga Normal | Harga Promo      |
| ----------------------------- | ------------ | ---------------- |
| 1GB RAM / 1 Core / 20GB SSD   | Rp 160.000   | **Rp 80.000**    |
| 2GB RAM / 2 Core / 40GB SSD   | Rp 320.000   | **Rp 160.000**   |
| 4GB RAM / 3 Core / 80GB SSD   | Rp 640.000   | **Rp 320.000**   |
| 8GB RAM / 4 Core / 160GB SSD  | Rp 1.200.000 | **Rp 600.000**   |
| 12GB RAM / 6 Core / 240GB SSD | Rp 1.600.000 | **Rp 800.000**   |
| 16GB RAM / 8 Core / 320GB SSD | Rp 2.400.000 | **Rp 1.200.000** |

> [!NOTE]
> Harga promo bisa berubah. Gunakan harga normal untuk kalkulasi long-term.

---

### Opsi 1: Budget Minimum (1 Notaris)

**Total: ~Rp 350.000/bulan**

| Komponen         | Spesifikasi             | Biaya/Bulan        |
| ---------------- | ----------------------- | ------------------ |
| VPS Domainesia   | 2GB RAM / 2 Core / 40GB | Rp 160.000 (promo) |
| PostgreSQL       | Internal di VPS         | Rp 0               |
| Domain .com      | Tahunan ~Rp 180.000     | Rp 15.000          |
| SSL              | Let's Encrypt (Free)    | Rp 0               |
| Google Drive     | 15GB gratis per akun    | Rp 0               |
| Backup & Buffer  |                         | Rp 50.000          |
| **TOTAL PROMO**  |                         | **Rp 225.000**     |
| **TOTAL NORMAL** |                         | **Rp 385.000**     |

---

### Opsi 2: Standard (3-5 Notaris)

**Total: ~Rp 550.000/bulan**

| Komponen         | Spesifikasi             | Biaya/Bulan        |
| ---------------- | ----------------------- | ------------------ |
| VPS Domainesia   | 4GB RAM / 3 Core / 80GB | Rp 320.000 (promo) |
| PostgreSQL       | Internal di VPS         | Rp 0               |
| Domain           | Per notaris             | Rp 15.000          |
| SSL              | Let's Encrypt (Free)    | Rp 0               |
| Cloudflare       | CDN + DDoS (Free)       | Rp 0               |
| Backup           | Weekly backup           | Rp 50.000          |
| Google Drive     | Per notaris             | Rp 0               |
| **TOTAL PROMO**  |                         | **Rp 385.000**     |
| **TOTAL NORMAL** |                         | **Rp 705.000**     |

---

### Opsi 3: Premium (10+ Notaris)

**Total: ~Rp 900.000/bulan**

| Komponen         | Spesifikasi              | Biaya/Bulan        |
| ---------------- | ------------------------ | ------------------ |
| VPS Domainesia   | 8GB RAM / 4 Core / 160GB | Rp 600.000 (promo) |
| PostgreSQL       | Internal atau Supabase   | Rp 0               |
| Domain           | Custom                   | Rp 15.000          |
| SSL              | Let's Encrypt            | Rp 0               |
| CDN              | Cloudflare (Free)        | Rp 0               |
| Backup           | Daily auto-backup        | Rp 100.000         |
| Monitoring       | Uptime Robot (Free)      | Rp 0               |
| **TOTAL PROMO**  |                          | **Rp 715.000**     |
| **TOTAL NORMAL** |                          | **Rp 1.315.000**   |

---

## 💵 Struktur Harga Jual

### Ke Agen Reseller

| Tier         | OPEX Basis | Margin Agen | Harga ke Agen        |
| ------------ | ---------- | ----------- | -------------------- |
| **Basic**    | Rp 350.000 | +Rp 400.000 | **Rp 750.000/bln**   |
| **Standard** | Rp 550.000 | +Rp 450.000 | **Rp 1.000.000/bln** |
| **Premium**  | Rp 900.000 | +Rp 600.000 | **Rp 1.500.000/bln** |

---

### Ke Notaris (End User)

| Tier         | Harga Agen   | Margin Agen → Notaris | Harga Final          |
| ------------ | ------------ | --------------------- | -------------------- |
| **Basic**    | Rp 750.000   | +Rp 750.000 (100%)    | **Rp 1.500.000/bln** |
| **Standard** | Rp 1.000.000 | +Rp 1.000.000 (100%)  | **Rp 2.000.000/bln** |
| **Premium**  | Rp 1.500.000 | +Rp 1.500.000 (100%)  | **Rp 3.000.000/bln** |

---

## 📋 Paket Subscription untuk Notaris

### 🥉 Paket Bronze - Rp 1.500.000/bulan

- 2 Super User + 100 Klien
- 15GB Storage (Google Drive)
- Email notifications
- Support via WhatsApp (jam kerja)
- Maintenance bulanan

### 🥈 Paket Silver - Rp 2.000.000/bulan

- 5 Super User + 500 Klien
- 30GB Storage (2 Google Drive)
- Email + Push notifications
- Priority WhatsApp support
- Weekly backup
- Maintenance bulanan

### 🥇 Paket Gold - Rp 3.000.000/bulan

- Unlimited Super User + Unlimited Klien
- 75GB+ Storage (5 Google Drive)
- Email + Push + SMS notifications
- 24/7 Priority support
- Daily backup
- Maintenance mingguan
- Custom branding

---

## 💼 Biaya Tambahan (Opsional)

| Item                | Biaya                        |
| ------------------- | ---------------------------- |
| Setup & Instalasi   | Rp 2.500.000 (one-time)      |
| Training 2 jam      | Rp 500.000                   |
| Custom Domain Setup | Rp 250.000                   |
| Migrasi Data        | Rp 1.000.000 - 3.000.000     |
| Custom Feature      | Rp 500.000 - 5.000.000/fitur |
| Maintenance On-call | Rp 500.000/bulan             |

---

## 📊 Proyeksi Keuntungan Agen

### Skenario: 10 Klien Notaris (Paket Silver)

| Item                   | Kalkulasi                         |
| ---------------------- | --------------------------------- |
| **Pendapatan**         | 10 × Rp 2.000.000 = Rp 20.000.000 |
| **Bayar ke Developer** | 10 × Rp 1.000.000 = Rp 10.000.000 |
| **OPEX Infrastruktur** | 1 VPS 8GB = Rp 600.000            |
| **Gross Profit**       | **Rp 9.400.000/bulan**            |

### Skenario: 5 Klien (Mixed Tier)

| Paket          | Jumlah | Pendapatan        | Biaya ke Dev         |
| -------------- | ------ | ----------------- | -------------------- |
| Bronze         | 2      | Rp 3.000.000      | Rp 1.500.000         |
| Silver         | 2      | Rp 4.000.000      | Rp 2.000.000         |
| Gold           | 1      | Rp 3.000.000      | Rp 1.500.000         |
| **Total**      | 5      | **Rp 10.000.000** | **Rp 5.000.000**     |
| **Net Profit** |        |                   | **Rp 5.000.000/bln** |

---

## 🔧 Konfigurasi Deployment Rekomendasi

```
┌─────────────────────────────────────────────────────────┐
│                    ARSITEKTUR SISTEM                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐     ┌─────────────┐                   │
│  │   Notaris   │     │   Notaris   │ ... (N clients)  │
│  │   Portal 1  │     │   Portal 2  │                   │
│  └──────┬──────┘     └──────┬──────┘                   │
│         │                   │                           │
│         └─────────┬─────────┘                           │
│                   │                                     │
│         ┌─────────▼─────────┐                          │
│         │   NGINX Reverse   │                          │
│         │      Proxy        │                          │
│         └─────────┬─────────┘                          │
│                   │                                     │
│    ┌──────────────┼──────────────┐                     │
│    │              │              │                     │
│    ▼              ▼              ▼                     │
│ ┌──────┐     ┌──────┐     ┌──────────┐                │
│ │Next.js│    │Next.js│    │PostgreSQL│                │
│ │ App 1 │    │ App 2 │    │    DB    │                │
│ └──────┘     └──────┘     └──────────┘                │
│                                                         │
│         ┌─────────────────────┐                        │
│         │   Google Drive(s)   │                        │
│         │   Document Storage  │                        │
│         └─────────────────────┘                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Catatan Penting

> [!IMPORTANT]
>
> - Harga VPS Domainesia dengan promo 50% bisa berakhir sewaktu-waktu
> - Google Drive gratis hanya 15GB per akun, bisa ditambah akun
> - Untuk SMS notification, perlu integrasi pihak ketiga (~Rp 500/SMS)
> - Maintenance rutin sangat penting untuk keamanan

> [!TIP]
>
> - Gunakan 1 VPS untuk multiple notaris (multi-tenant) untuk efisiensi
> - Ambil VPS tahunan untuk dapat harga lebih murah
> - Pakai Cloudflare untuk CDN dan DDoS protection gratis

---

## ✅ Kesimpulan

**Rekomendasi untuk mulai:**

1. Start dengan VPS Domainesia **4GB Rp 320.000/bulan** (promo)
2. Jual paket **Silver Rp 2.000.000/bulan** ke notaris
3. **Margin bersih Rp 1.000.000-1.500.000** per klien
4. Target 5-10 klien = **Rp 5.000.000-15.000.000/bulan profit**

---

_Dokumen ini dibuat berdasarkan analisis sistem client-portal dan harga real Domainesia.com per Desember 2025._
