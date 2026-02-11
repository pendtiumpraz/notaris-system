# 🖥️ Spesifikasi VPS - Portal Klien Notaris

> **Dokumen Rekomendasi Infrastruktur Server**
> Disusun: 9 Februari 2026 | Berdasarkan Tech Stack Aplikasi

---

## 📋 Ringkasan Cepat

| Skala        | RAM | CPU    | Storage   | Harga/Bulan\* |
| ------------ | --- | ------ | --------- | ------------- |
| **Minimum**  | 2GB | 2 Core | 40GB SSD  | Rp 160.000    |
| **Standard** | 4GB | 3 Core | 80GB SSD  | Rp 320.000    |
| **Premium**  | 8GB | 4 Core | 160GB SSD | Rp 600.000    |

_\*Harga berdasarkan Domainesia.com dengan promo 50%_

---

## 🔧 Tech Stack & Resource Requirements

### Komponen Aplikasi

| Komponen                    | RAM Usage     | CPU Usage  | Notes                       |
| --------------------------- | ------------- | ---------- | --------------------------- |
| **Next.js 16 (Production)** | 512MB - 1GB   | Low-Medium | SSR membutuhkan RAM lebih   |
| **Node.js Runtime**         | 256MB - 512MB | Low        | Per instance                |
| **PostgreSQL Database**     | 512MB - 1GB   | Low-Medium | Tergantung query complexity |
| **NGINX Reverse Proxy**     | 50MB - 100MB  | Very Low   | Lightweight                 |
| **OS (Ubuntu/Debian)**      | 256MB - 512MB | Low        | Base system                 |

### Total Kebutuhan Minimum

```
┌─────────────────────────────────────────────┐
│ Next.js App        : 512MB - 1GB           │
│ PostgreSQL         : 512MB - 1GB           │
│ Node.js Runtime    : 256MB - 512MB         │
│ NGINX              : 50MB - 100MB          │
│ Operating System   : 256MB - 512MB         │
├─────────────────────────────────────────────┤
│ TOTAL MINIMUM      : ~1.5GB - 3GB RAM      │
└─────────────────────────────────────────────┘
```

---

## 📦 Rekomendasi Per Skala

### 🥉 Tier 1: Minimum (1 Notaris)

**Spesifikasi:**

- **RAM:** 2GB
- **CPU:** 2 Core
- **Storage:** 40GB SSD
- **Bandwidth:** 1TB/bulan

**Kapasitas:**

- 1 Tenant Notaris
- ~100 Klien aktif
- ~1.000 dokumen

**Cocok untuk:**

- Testing & Development
- Notaris perorangan
- Pilot project

**Estimasi Biaya:**
| Provider | Harga Normal | Harga Promo |
|----------|--------------|-------------|
| Domainesia | Rp 320.000 | Rp 160.000 |
| DigitalOcean | $12/bulan | - |
| Vultr | $12/bulan | - |

---

### 🥈 Tier 2: Standard (3-5 Notaris)

**Spesifikasi:**

- **RAM:** 4GB
- **CPU:** 3 Core
- **Storage:** 80GB SSD
- **Bandwidth:** 2TB/bulan

**Kapasitas:**

- 3-5 Tenant Notaris
- ~500 Klien aktif
- ~5.000 dokumen

**Cocok untuk:**

- Multi-tenant production
- Kantor notaris menengah
- Agen dengan beberapa klien

**Estimasi Biaya:**
| Provider | Harga Normal | Harga Promo |
|----------|--------------|-------------|
| Domainesia | Rp 640.000 | Rp 320.000 |
| DigitalOcean | $24/bulan | - |
| Vultr | $24/bulan | - |

---

### 🥇 Tier 3: Premium (10+ Notaris)

**Spesifikasi:**

- **RAM:** 8GB
- **CPU:** 4 Core
- **Storage:** 160GB SSD
- **Bandwidth:** 4TB/bulan

**Kapasitas:**

- 10+ Tenant Notaris
- ~1.000+ Klien aktif
- ~10.000+ dokumen

**Cocok untuk:**

- Enterprise deployment
- Multi-cabang notaris besar
- Agen reseller skala besar

**Estimasi Biaya:**
| Provider | Harga Normal | Harga Promo |
|----------|--------------|-------------|
| Domainesia | Rp 1.200.000 | Rp 600.000 |
| DigitalOcean | $48/bulan | - |
| Vultr | $48/bulan | - |

---

## 💾 Catatan Storage

### Dokumen Disimpan di Google Drive (GRATIS!)

Aplikasi ini menggunakan **Google Drive** untuk penyimpanan dokumen, sehingga:

- ✅ **Storage VPS tidak terpakai untuk dokumen**
- ✅ **15GB gratis per akun Google**
- ✅ **Bisa pakai multiple akun Google Drive**

### Penggunaan Storage VPS

| Komponen            | Estimasi Size           |
| ------------------- | ----------------------- |
| Operating System    | 5-10GB                  |
| PostgreSQL Database | 1-5GB (tergantung data) |
| Next.js Application | 500MB - 1GB             |
| Logs & Cache        | 2-5GB                   |
| **Total**           | **~10-20GB**            |

> 💡 **Kesimpulan:** VPS dengan 40GB SSD sudah lebih dari cukup karena dokumen disimpan di Google Drive!

---

## 🌐 Software Requirements

### Sistem Operasi

- **Recommended:** Ubuntu 22.04 LTS / Ubuntu 24.04 LTS
- **Alternative:** Debian 12, AlmaLinux 9

### Runtime & Dependencies

```bash
# Node.js
Node.js 20.x LTS atau 22.x

# Database
PostgreSQL 15 atau 16

# Web Server
NGINX (latest stable)

# Process Manager
PM2 (untuk production)

# SSL
Certbot (Let's Encrypt)
```

### Optional (Recommended)

```bash
# CDN & DDoS Protection
Cloudflare (Free tier)

# Monitoring
Uptime Robot (Free)
Netdata (Free, self-hosted)

# Backup
Automated PostgreSQL backup script
```

---

## 🔒 Security Checklist

- [ ] Firewall (UFW) configured
- [ ] SSH key-only authentication
- [ ] Fail2ban installed
- [ ] PostgreSQL tidak exposed ke public
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] Regular security updates
- [ ] Automated backups configured

---

## 📊 Scaling Guide

### Kapan Harus Upgrade?

| Indikator                    | Tindakan                                 |
| ---------------------------- | ---------------------------------------- |
| RAM usage > 80% consistently | Upgrade RAM                              |
| CPU usage > 70% consistently | Upgrade CPU                              |
| Response time > 3 detik      | Cek database queries, upgrade jika perlu |
| Storage > 80%                | Upgrade storage atau cleanup             |
| Jumlah tenant > 5            | Pertimbangkan Tier 2                     |
| Jumlah tenant > 10           | Pertimbangkan Tier 3                     |

### Horizontal Scaling (Advanced)

Untuk skala sangat besar (50+ notaris):

```
┌─────────────────────────────────────────────┐
│            Load Balancer (NGINX)            │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
   │ App 1   │ │ App 2  │ │ App 3  │
   └────┬────┘ └───┬────┘ └───┬────┘
        │          │          │
        └──────────┼──────────┘
                   │
          ┌────────▼────────┐
          │ PostgreSQL      │
          │ (Managed/RDS)   │
          └─────────────────┘
```

---

## ✅ Rekomendasi Final

### Untuk Memulai (Recommended)

```
📦 VPS 4GB RAM / 3 Core / 80GB SSD
   └── Provider: Domainesia
   └── Harga: Rp 320.000/bulan (promo)
   └── OS: Ubuntu 22.04 LTS
   └── Kapasitas: 3-5 notaris
```

### Kenapa 4GB?

1. **Headroom** - Masih ada ruang untuk scaling
2. **Reliability** - Tidak akan crash saat traffic spike
3. **Multi-tenant ready** - Bisa langsung onboard beberapa klien
4. **Cost-effective** - Harga reasonable dengan kapasitas bagus

---

## 📞 Provider VPS Lokal (Indonesia)

| Provider        | Website           | Kelebihan                |
| --------------- | ----------------- | ------------------------ |
| **Domainesia**  | domainesia.com    | Promo 50%, support bagus |
| **Niagahoster** | niagahoster.co.id | Interface mudah          |
| **Dewaweb**     | dewaweb.com       | Security focused         |
| **IDCloudHost** | idcloudhost.com   | Harga kompetitif         |

---

_Dokumen ini dibuat berdasarkan analisis tech stack Next.js + PostgreSQL dan best practices deployment._
