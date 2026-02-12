/**
 * Knowledge Base Seed Data
 * Run: npx tsx prisma/seed-knowledge.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const accelerateUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  ...(accelerateUrl?.startsWith('prisma+') ? { accelerateUrl } : {}),
});

// Simple chunker (inline to avoid import issues in seed script)
function chunkText(content: string, maxSize = 1500): string[] {
  if (content.length <= maxSize) return [content.trim()];

  const chunks: string[] = [];
  const sections = content.split(/\n(?=#{1,3}\s)/);
  let currentChunk = '';

  for (const section of sections) {
    if (section.length > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      const paras = section.split(/\n\n+/);
      for (const para of paras) {
        if (currentChunk.length + para.length + 2 > maxSize && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = para;
        } else {
          currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
        }
      }
    } else if (currentChunk.length + section.length + 2 > maxSize) {
      chunks.push(currentChunk.trim());
      currentChunk = section;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${section}` : section;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

interface KBItem {
  title: string;
  category: string;
  content: string;
  allowedRoles: string[];
  description?: string;
}

const KNOWLEDGE_ITEMS: KBItem[] = [
  // ======================== FITUR CLIENT ========================
  {
    title: 'Navigasi Aplikasi - Client',
    category: 'fitur',
    description: 'Panduan navigasi untuk klien yang sudah login',
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Navigasi Aplikasi untuk Client

## Dashboard (/dashboard)
Halaman utama setelah login. Menampilkan:
- Statistik dokumen (total, sedang diproses, selesai)
- Daftar appointment/janji temu mendatang
- Notifikasi terbaru
- Quick actions: buat dokumen, buat janji

## Dokumen Saya (/documents)
Daftar semua dokumen milik klien.
- Lihat status dokumen (Draft, Submitted, In Review, Approved, Completed, Rejected)
- Klik dokumen untuk melihat detail, timeline, dan file
- Upload berkas/persyaratan yang diminta
- Download dokumen yang sudah selesai

## Janji Temu (/appointments)
Kelola jadwal pertemuan dengan notaris/staff.
- Buat janji baru: pilih layanan → pilih tanggal & waktu → konfirmasi
- Lihat daftar janji mendatang dan yang sudah selesai
- Batalkan atau ubah jadwal janji

## Tagihan (/billing)
Informasi tagihan dan pembayaran.
- Lihat invoice yang dikirim oleh kantor
- Status pembayaran (belum dibayar, lunas, sebagian)
- Riwayat pembayaran
- Detail biaya per layanan

## Pesan (/messages)
Komunikasi dengan staff dan admin kantor.
- Kirim pesan tentang dokumen tertentu
- Lihat riwayat percakapan
- Notifikasi pesan baru

## Notifikasi (/notifications)
Semua notifikasi terkait:
- Update status dokumen
- Pengingat janji temu
- Invoice baru
- Pesan masuk

## Profil (/profile)
Kelola data pribadi:
- Edit nama, email, telepon
- Ganti password
- Foto profil`,
  },

  // ======================== FITUR STAFF ========================
  {
    title: 'Navigasi Aplikasi - Staff',
    category: 'fitur',
    description: 'Panduan navigasi untuk staff kantor notaris',
    allowedRoles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Navigasi Aplikasi untuk Staff

## Dashboard (/dashboard)
Dashboard kerja staff dengan:
- Assignment dokumen yang ditugaskan
- Statistik kerja (dokumen selesai, dalam proses)
- Appointment hari ini
- Quick actions

## Kelola Dokumen (/documents)
- Lihat semua dokumen yang ditugaskan
- Buat dokumen baru untuk client
- Filter berdasarkan status, tipe, client
- Klik "Editor" untuk membuka editor dokumen

## Editor Dokumen (/documents/[id]/editor)
Editor dokumen lengkap dengan fitur:
- Rich text editor (bold, italic, heading, tabel, list)
- Page Setup: pilih ukuran kertas (A4, Legal, Letter, F4), orientasi, margin, font size
- Multi-page preview dengan visual page break
- Export PDF sesuai setting halaman
- AI Assistant panel di sebelah kanan:
  * Generate: buat draft dokumen otomatis
  * Analyze: analisis dokumen
  * Correct: koreksi bahasa dan hukum
  * Revise: revisi dokumen
  * Translate: terjemahan
  * Summarize: ringkasan dokumen
  * Letter: buat surat pengantar

## Repertorium (/repertorium)
Buku repertorium notaris digital:
- Nomor urut akta
- Tanggal, sifat akta, nama penghadap
- Filter per tahun dan bulan
- Tambah entri baru

## Klapper (/klapper)
Indeks klapper notaris:
- Pencarian berdasarkan nama penghadap
- Filter berdasarkan huruf awal, tahun, bulan

## Janji Temu (/appointments)
- Kelola jadwal appointment
- Konfirmasi/tolak janji dari client
- Atur ketersediaan waktu

## Tagihan (/billing)
- Buat invoice untuk client
- Catat pembayaran masuk
- Lihat riwayat billing

## Pesan (/messages)
- Komunikasi dengan client dan sesama staff
- Chat per dokumen

## Staff (/staff)
- Lihat daftar staff lain`,
  },

  // ======================== FITUR ADMIN ========================
  {
    title: 'Navigasi Aplikasi - Admin',
    category: 'fitur',
    description: 'Panduan navigasi untuk admin kantor notaris',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    content: `# Navigasi Aplikasi untuk Admin

Semua fitur staff tersedia untuk admin, ditambah:

## Kelola User (/admin/users)
- Tambah user baru (client, staff, admin)
- Edit data user
- Ganti role user
- Nonaktifkan/hapus user
- Lihat semua user terdaftar

## Kelola Cabang (/admin/branches)
- Tambah cabang kantor baru
- Edit alamat dan info cabang
- Assign staff ke cabang

## Kelola Layanan (/admin/services)
- Tambah/edit jenis layanan notaris
- Set durasi estimasi per layanan
- Aktifkan/nonaktifkan layanan

## Jenis Dokumen (/admin/document-types)
- Buat tipe dokumen baru (Akta, Surat, Perjanjian, dll)
- Set persyaratan dokumen per tipe
- Estimasi durasi pembuatan

## Template (/admin/templates)
- Buat template dokumen dengan placeholder
- Kategori template (Akta, Surat, Perjanjian)
- Edit dan hapus template

## Laporan (/admin/reports)
- Laporan statistik kantor
- Grafik dokumen per bulan
- Laporan keuangan

## AI Settings (/admin/ai-settings)
- Pilih AI provider (OpenAI, Google Gemini, DeepSeek)
- Pilih model AI
- Masukkan API key
- Test koneksi

## Feature Flags (/admin/feature-flags)
- Hidupkan/matikan fitur tertentu
- Kontrol akses fitur secara granular

## Audit Logs (/admin/audit-logs)
- Riwayat aktivitas semua user
- Filter berdasarkan aksi, user, tanggal

## Content Management (/admin/content)
- Kelola FAQ yang ditampilkan di landing page
- Edit konten halaman publik

## Gallery (/admin/gallery)
- Upload dan kelola foto kantor
- Tampilkan di landing page

## Google Drive (/admin/drives)
- Hubungkan akun Google Drive
- Sinkronisasi file dokumen

## Tarif Layanan (/admin/service-fees)
- Set tarif per jenis layanan
- Kategori tarif (notaris, PPAT)

## Pengaturan (/admin/settings)
- Pengaturan umum kantor
- Info kontak dan alamat`,
  },

  // ======================== SUPER ADMIN ========================
  {
    title: 'Navigasi Aplikasi - Super Admin',
    category: 'fitur',
    description: 'Panduan navigasi khusus super admin',
    allowedRoles: ['SUPER_ADMIN'],
    content: `# Fitur Khusus Super Admin

Semua fitur admin tersedia, ditambah:

## License (/admin/license)
- Lihat status lisensi aplikasi
- Info masa aktif lisensi
- Informasi server lisensi

## AI Analytics (/admin/ai-analytics)
- Total percakapan chatbot
- Total token yang digunakan
- Estimasi biaya AI (USD & IDR)
- Breakdown per role
- Trend penggunaan harian/bulanan
- Top pertanyaan user

## Knowledge Base (/admin/knowledge-base)
- Kelola knowledge base untuk chatbot AI
- Tambah/edit/hapus item knowledge
- Set kategori dan role akses per item
- Preview chunk setelah save
- Seed knowledge base awal

## System Configuration
- Akses penuh ke semua pengaturan
- Dapat mengubah role user manapun
- Akses ke semua data dan laporan`,
  },

  // ======================== FLOW DOKUMEN ========================
  {
    title: 'Flow Pembuatan Dokumen',
    category: 'flow',
    description: 'Langkah-langkah lengkap pembuatan dokumen dari awal sampai selesai',
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Flow Pembuatan Dokumen Notaris

## Langkah 1: Buat Dokumen
- Client mengajukan pembuatan dokumen melalui portal
- Atau staff/admin membuat dokumen baru di halaman /documents
- Isi form: pilih tipe dokumen, client, judul, deskripsi
- Status awal: DRAFT

## Langkah 2: Assign Staff
- Admin/staff senior assign dokumen ke staff yang bertanggung jawab
- Staff yang ditugaskan akan menerima notifikasi

## Langkah 3: Draft & Editing
- Staff membuka dokumen di Editor (/documents/[id]/editor)
- Gunakan AI tools untuk generate draft awal
- Edit menggunakan rich text editor
- Setup halaman: ukuran kertas, margin, font size
- Preview multi-page

## Langkah 4: Review
- Status diubah ke IN_REVIEW
- Notaris/admin review dokumen
- Jika perlu revisi → kembali ke DRAFT
- Gunakan AI "Correct" untuk koreksi otomatis

## Langkah 5: Approved
- Setelah review, status diubah ke APPROVED
- Dokumen siap untuk ditandatangani
- Export PDF untuk cetak

## Langkah 6: Completed
- Setelah ditandatangani, status COMPLETED
- Client dapat download dokumen final
- Catat di repertorium dan klapper

## Langkah 7: Checklist
- Verifikasi semua persyaratan terpenuhi
- Staff centang checklist (/documents/[id] → tab checklist)
- Tandai verifikasi oleh siapa dan kapan

## Status Dokumen:
- DRAFT: Masih dalam penyusunan
- SUBMITTED: Diajukan, menunggu review
- IN_REVIEW: Sedang direview notaris
- NEEDS_REVISION: Perlu revisi
- APPROVED: Disetujui, siap tanda tangan
- COMPLETED: Selesai
- REJECTED: Ditolak
- CANCELLED: Dibatalkan`,
  },

  // ======================== FLOW APPOINTMENT ========================
  {
    title: 'Flow Appointment / Janji Temu',
    category: 'flow',
    description: 'Cara membuat dan mengelola janji temu',
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Flow Janji Temu / Appointment

## Untuk Client:

### Buat Janji Baru (/appointments)
1. Klik tombol "Buat Janji Baru"
2. Pilih jenis layanan (misal: Konsultasi, Pembuatan Akta, dll)
3. Pilih tanggal yang tersedia
4. Pilih waktu yang tersedia
5. Tambahkan catatan jika perlu
6. Klik "Konfirmasi"

### Status Appointment:
- PENDING: Menunggu konfirmasi staff
- CONFIRMED: Sudah dikonfirmasi
- CANCELLED: Dibatalkan
- COMPLETED: Selesai
- NO_SHOW: Client tidak datang

### Kelola Janji:
- Lihat daftar janji mendatang di /appointments
- Batalkan janji jika tidak bisa hadir
- Reschedule ke tanggal/waktu lain

## Untuk Staff/Admin:

### Kelola Appointment (/appointments)
- Lihat semua appointment masuk
- Konfirmasi atau tolak janji
- Atur ketersediaan waktu di Staff Availability
- Mark appointment sebagai completed setelah pertemuan`,
  },

  // ======================== FLOW BILLING ========================
  {
    title: 'Flow Billing & Pembayaran',
    category: 'flow',
    description: 'Proses billing invoice dan pembayaran',
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Flow Billing & Pembayaran

## Untuk Staff/Admin - Buat Invoice:
1. Buka halaman /billing
2. Klik "Buat Invoice Baru"
3. Pilih client dan (opsional) dokumen terkait
4. Tambahkan item-item biaya (jenis layanan, jumlah, harga)
5. Set pajak (PPN) jika ada
6. Set diskon jika ada
7. Tentukan tanggal jatuh tempo
8. Kirim invoice ke client

## Status Invoice:
- DRAFT: Belum dikirim
- SENT: Sudah dikirim ke client
- PAID: Lunas
- PARTIALLY_PAID: Dibayar sebagian
- OVERDUE: Melewati jatuh tempo
- CANCELLED: Dibatalkan

## Untuk Client - Lihat & Bayar:
1. Buka halaman /billing
2. Lihat daftar invoice
3. Klik invoice untuk melihat detail
4. Lakukan pembayaran sesuai metode yang tersedia

## Metode Pembayaran:
- Transfer Bank
- QRIS
- Cash
- Kartu Kredit

## Catat Pembayaran (Staff/Admin):
1. Buka invoice di /billing
2. Klik "Catat Pembayaran"
3. Masukkan jumlah, metode, dan referensi
4. Invoice otomatis update status`,
  },

  // ======================== EDITOR & AI TOOLS ========================
  {
    title: 'Editor Dokumen & AI Tools',
    category: 'fitur',
    description: 'Panduan menggunakan editor dokumen dan AI assistant',
    allowedRoles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Editor Dokumen & AI Tools

## Akses Editor
- Buka dari /documents → klik ikon "Editor" pada dokumen
- Atau langsung ke /documents/[id]/editor

## Fitur Editor:
- Rich text: bold, italic, underline, strikethrough
- Heading: H1, H2, H3
- List: bullet dan numbered
- Tabel: insert dan edit tabel
- Undo/Redo
- Auto-save

## Page Setup (Pengaturan Halaman):
Klik tombol "Page Setup" di toolbar untuk mengatur:
- Ukuran Kertas: A4 (210×297mm), Legal (216×356mm), Letter (216×279mm), F4/Folio (215×330mm)
- Orientasi: Portrait (tegak) atau Landscape (mendatar)
- Margin: Atas, Bawah, Kiri, Kanan (dalam mm, 5-50mm)
- Font Size: 8pt sampai 24pt

## Multi-Page Preview:
- Editor menampilkan halaman sesuai ukuran kertas yang dipilih
- Konten yang melebihi satu halaman otomatis overflow ke halaman berikutnya
- Garis abu-abu menandakan batas halaman (page break)

## Export PDF:
- Klik tombol "Export PDF" di toolbar
- PDF akan menggunakan ukuran kertas, orientasi, margin, dan font yang sama persis dengan editor
- Hasil PDF pixel-perfect sesuai tampilan editor

## AI Assistant (panel kanan):
Panel AI di sebelah kanan editor menyediakan 7 aksi:

1. **Generate** (🤖): Buat draft dokumen otomatis berdasarkan tipe dan info dokumen
2. **Analyze** (🔍): Analisis dokumen untuk menemukan potensi masalah hukum
3. **Correct** (✏️): Koreksi ejaan, tata bahasa, dan istilah hukum
4. **Revise** (📝): Revisi dokumen berdasarkan instruksi tambahan
5. **Translate** (🌐): Terjemahkan dokumen ke bahasa lain
6. **Summarize** (📋): Buat ringkasan dokumen
7. **Letter** (✉️): Buat surat pengantar dokumen

### Cara Menggunakan AI:
1. Ketik instruksi/catatan di text area AI panel
2. Klik tombol aksi yang diinginkan
3. Tunggu AI memproses (loading indicator akan muncul)
4. Hasil AI akan ditampilkan di panel
5. Klik "Terapkan ke Editor" untuk memasukkan hasil ke dokumen
6. Dokumen otomatis di-save setelah konten diterapkan`,
  },

  // ======================== TEMPLATE DOKUMEN ========================
  {
    title: 'Template Dokumen',
    category: 'fitur',
    description: 'Cara menggunakan dan mengelola template dokumen',
    allowedRoles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Template Dokumen

## Akses Template (/admin/templates)
Hanya admin yang bisa mengelola template.

## Buat Template Baru:
1. Klik "Buat Template"
2. Isi nama template dan deskripsi
3. Pilih tipe dokumen terkait (opsional)
4. Pilih kategori: Akta, Surat, Perjanjian
5. Tulis konten template dengan placeholder

## Placeholder:
Gunakan format {{placeholder}} untuk bagian yang akan diisi:
- {{nama_client}} - Nama client
- {{tanggal}} - Tanggal dokumen
- {{nomor_akta}} - Nomor akta
- {{alamat}} - Alamat
- Dan placeholder custom lainnya

## Gunakan Template:
Staff dapat memilih template saat membuat dokumen baru di editor.
Template akan otomatis mengisi konten editor dengan placeholder yang bisa diedit.`,
  },

  // ======================== REPERTORIUM & KLAPPER ========================
  {
    title: 'Repertorium & Klapper',
    category: 'fitur',
    description: 'Panduan buku repertorium dan indeks klapper',
    allowedRoles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Repertorium & Klapper

## Repertorium (/repertorium)
Buku daftar akta notaris sesuai UUJN.

### Isi Repertorium:
- Nomor urut (otomatis)
- Nomor bulanan
- Tanggal akta
- Sifat akta (akta autentik/bawah tangan)
- Nama penghadap (bisa lebih dari satu)
- Keterangan
- Tipe: Notaris atau PPAT

### Cara Menambah:
1. Buka halaman /repertorium
2. Klik "Tambah Repertorium"
3. Isi form: tanggal, sifat akta, nama penghadap, keterangan
4. Pilih dokumen terkait (opsional)
5. Simpan

### Filter:
- Per tahun dan bulan
- Tipe: Notaris/PPAT

## Klapper (/klapper)
Indeks alfabet untuk pencarian cepat akta.

### Isi Klapper:
- Nama penghadap
- Sifat akta
- Nomor akta
- Tanggal akta
- Huruf awal (otomatis dari nama)

### Pencarian:
- Cari berdasarkan nama penghadap
- Filter per huruf awal
- Filter per tahun dan bulan
- Klapper otomatis dibuat saat menambah repertorium`,
  },

  // ======================== USER MANAGEMENT ========================
  {
    title: 'User Management',
    category: 'fitur',
    description: 'Cara mengelola user di sistem',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    content: `# User Management (/admin/users)

## Role Pengguna:
- **SUPER_ADMIN**: Akses penuh ke semua fitur dan konfigurasi sistem
- **ADMIN**: Kelola kantor, user, setting, laporan
- **STAFF**: Kelola dokumen, appointment, billing, komunikasi
- **CLIENT**: Akses portal klien, lihat dokumen, buat janji, lihat tagihan

## Tambah User Baru:
1. Buka /admin/users
2. Klik "Tambah User"
3. Isi: nama, email, password, nomor telepon
4. Pilih role (CLIENT, STAFF, ADMIN)
5. Untuk CLIENT: otomatis buat data Client dengan nomor client
6. Untuk STAFF: otomatis buat data Staff dengan employee ID
7. Simpan

## Edit User:
- Klik user di daftar
- Edit nama, email, telepon, role
- Reset password jika diperlukan

## Nonaktifkan User:
- Soft delete (data tetap ada, user tidak bisa login)
- Klik tombol "Hapus" pada user

## Catatan:
- Email harus unik
- Password ter-hash di database
- Perubahan role langsung berlaku saat user login berikutnya`,
  },

  // ======================== AI SETTINGS ========================
  {
    title: 'AI Settings & Provider',
    category: 'fitur',
    description: 'Cara mengatur AI provider dan model',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    content: `# AI Settings (/admin/ai-settings)

## Provider yang Didukung:

### OpenAI
- GPT-5.2, GPT-5.1, GPT-5, GPT-4o, GPT-4o Mini
- Pricing: $0.15-$10/1M tokens
- Cocok untuk: reasoning superior, dokumen kompleks

### Google Gemini
- Gemini 3 Flash, Gemini 3 Pro, Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash Lite
- Pricing: $0.025-$5/1M tokens
- Cocok untuk: hemat biaya, context window besar (1M tokens)

### DeepSeek
- DeepSeek V3.2 Chat, DeepSeek V3.2 Reasoner
- Pricing: $0.27-$2.19/1M tokens
- Cocok untuk: reasoning bagus dengan harga terjangkau

## Cara Setting:
1. Buka /admin/ai-settings
2. Pilih provider yang ingin diaktifkan
3. Masukkan API key
4. Pilih model default
5. Test koneksi
6. Simpan

## Tips Pemilihan:
- Untuk chatbot (volume tinggi): Gemini 2.5 Flash Lite atau GPT-4o Mini
- Untuk dokumen hukum (akurasi tinggi): GPT-5.2 atau Gemini 3 Pro
- Untuk budget terbatas: DeepSeek Chat`,
  },

  // ======================== FAQ UMUM ========================
  {
    title: 'FAQ Layanan Umum Notaris',
    category: 'faq',
    description: 'Pertanyaan umum tentang layanan kantor notaris',
    allowedRoles: ['GUEST', 'CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# FAQ Layanan Notaris

## Apa itu notaris?
Notaris adalah pejabat umum yang berwenang membuat akta otentik sesuai UUJN (Undang-Undang Jabatan Notaris). Akta notaris memiliki kekuatan pembuktian yang kuat di pengadilan.

## Layanan apa saja yang tersedia?
Layanan umum notaris meliputi:
- Pembuatan akta jual beli (AJB)
- Akta pendirian PT (Perseroan Terbatas)
- Akta kuasa
- Akta perjanjian
- SKMHT & APHT (Hak Tanggungan)
- Legalisasi dokumen
- Waarmerking
- Pembuatan surat keterangan
- Konsultasi hukum

## Dokumen apa yang perlu dibawa?
Persyaratan umum:
- KTP asli dan fotokopi
- Kartu Keluarga
- NPWP (jika ada)
- Dokumen terkait (misal: sertifikat tanah untuk AJB)
- Materai (biasanya disediakan kantor)

## Berapa biaya layanan notaris?
Biaya bervariasi tergantung jenis akta dan kompleksitas. Silakan gunakan halaman layanan kami untuk melihat estimasi biaya, atau buat appointment untuk konsultasi.

## Berapa lama proses pembuatan akta?
Estimasi waktu:
- Konsultasi: 30-60 menit
- Draft akta: 1-3 hari kerja
- Review dan revisi: 1-2 hari kerja
- Penandatanganan: sesuai jadwal
- Total proses: 3-7 hari kerja (tergantung jenis akta)

## Bagaimana cara membuat janji?
1. Daftar akun di portal kami
2. Login ke portal
3. Buka menu Appointments
4. Pilih layanan, tanggal, dan waktu
5. Tunggu konfirmasi dari pihak kantor

## Apakah bisa konsultasi online?
Ya, Anda bisa menghubungi kami melalui:
- Chatbot AI di website ini
- WhatsApp di nomor yang tertera
- Email kantor
- Atau buat appointment untuk video call`,
  },

  // ======================== PERSYARATAN DOKUMEN ========================
  {
    title: 'Info Persyaratan Dokumen',
    category: 'legal',
    description: 'Persyaratan dokumen per jenis akta',
    allowedRoles: ['GUEST', 'CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Persyaratan Dokumen per Jenis Akta

## Akta Jual Beli (AJB)
- KTP penjual dan pembeli (asli + fotokopi)
- Kartu Keluarga
- Sertifikat tanah asli
- PBB tahun terakhir (lunas)
- BPHTB (Bea Perolehan Hak atas Tanah)
- Bukti pembayaran PPh (jika PPAT)
- Surat persetujuan pasangan (jika menikah)
- NPWP penjual dan pembeli

## Pendirian Perseroan Terbatas (PT)
- KTP semua pendiri (asli + fotokopi)
- NPWP semua pendiri
- Nama PT yang diinginkan (3 opsi)
- Alamat domisili perusahaan
- Bidang usaha (KBLI)
- Modal dasar dan modal disetor
- Susunan pengurus (Direktur, Komisaris)
- Surat keterangan domisili

## Akta Kuasa
- KTP pemberi kuasa (asli + fotokopi)
- KTP penerima kuasa (asli + fotokopi)
- Dokumen terkait objek kuasa
- Uraian wewenang yang dikuasakan

## Surat Keterangan Waris
- KTP semua ahli waris
- Akta kematian pewaris
- Kartu Keluarga
- Akta kelahiran ahli waris
- Akta nikah pewaris
- Surat keterangan dari RT/RW/Kelurahan

## Legalisasi Dokumen
- Dokumen asli yang akan dilegalisasi
- KTP pemohon
- Materai cukup`,
  },

  // ======================== PROFIL & KEAMANAN ========================
  {
    title: 'Profil & Keamanan Akun',
    category: 'fitur',
    description: 'Cara mengelola profil dan keamanan akun',
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Profil & Keamanan (/profile)

## Edit Profil:
1. Buka menu Profil dari sidebar atau dropdown user
2. Edit nama, email, atau nomor telepon
3. Upload foto profil
4. Klik Simpan

## Ganti Password:
1. Buka halaman Profil
2. Klik tab "Keamanan" atau "Ganti Password"
3. Masukkan password lama
4. Masukkan password baru (minimal 8 karakter)
5. Konfirmasi password baru
6. Klik Simpan

## Tips Keamanan:
- Gunakan password yang kuat (kombinasi huruf, angka, simbol)
- Jangan bagikan password ke orang lain
- Logout setelah selesai menggunakan portal
- Laporkan jika ada aktivitas mencurigakan`,
  },

  // ======================== NOTIFIKASI & MESSAGING ========================
  {
    title: 'Notifikasi & Messaging',
    category: 'fitur',
    description: 'Sistem notifikasi dan pesan',
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
    content: `# Notifikasi & Messaging

## Notifikasi (/notifications)
Sistem notifikasi otomatis untuk:
- Update status dokumen (misal: "Dokumen Anda sudah di-review")
- Pengingat appointment (H-1 dan H-0)
- Invoice baru diterbitkan
- Pembayaran dikonfirmasi
- Pesan baru masuk

### Jenis Notifikasi:
- DOCUMENT_UPDATE: Perubahan status dokumen
- APPOINTMENT_REMINDER: Pengingat janji temu
- NEW_MESSAGE: Pesan baru
- INVOICE_UPDATE: Update tagihan
- SYSTEM: Notifikasi sistem

### Kelola Notifikasi:
- Buka /notifications untuk melihat semua
- Klik notifikasi untuk membuka item terkait
- Tandai sudah dibaca
- Hapus notifikasi lama

## Messaging (/messages)
Chat internal antara client dan staff/admin.

### Cara Mengirim Pesan:
1. Buka /messages
2. Pilih percakapan existing atau mulai baru
3. Pilih terkait dokumen tertentu (opsional)
4. Ketik pesan dan kirim

### Fitur:
- Pesan real-time
- Riwayat percakapan tersimpan
- Bisa dikaitkan dengan dokumen tertentu
- Notifikasi pesan baru`,
  },

  // ======================== FEATURE FLAGS ========================
  {
    title: 'Feature Flags',
    category: 'fitur',
    description: 'Cara mengelola feature flags',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    content: `# Feature Flags (/admin/feature-flags)

Feature flags memungkinkan admin menghidupkan/mematikan fitur tertentu tanpa deploy ulang.

## Cara Menggunakan:
1. Buka /admin/feature-flags
2. Lihat daftar fitur dengan toggle on/off
3. Klik toggle untuk mengaktifkan atau menonaktifkan fitur
4. Perubahan langsung berlaku

## Contoh Feature Flags:
- Enable AI Features: Aktifkan/nonaktifkan semua fitur AI
- Enable Chatbot: Aktifkan chatbot di landing page
- Enable Appointments: Izinkan pembuatan janji temu
- Enable Billing: Aktifkan modul billing
- Maintenance Mode: Tampilkan halaman maintenance

## Tips:
- Gunakan untuk soft-launch fitur baru
- Matikan fitur yang bermasalah tanpa deploy
- Test fitur di production dengan flag`,
  },

  // ======================== GOOGLE DRIVE ========================
  {
    title: 'Google Drive Integration',
    category: 'fitur',
    description: 'Cara menghubungkan dan menggunakan Google Drive',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    content: `# Google Drive Integration (/admin/drives)

## Cara Menghubungkan:
1. Buka /admin/drives
2. Klik "Hubungkan Google Drive"
3. Login dengan akun Google yang memiliki Google Drive
4. Berikan izin akses
5. Drive terhubung!

## Fitur:
- Upload file dokumen ke Google Drive otomatis
- Sinkronisasi file antara portal dan Drive
- Link sharing untuk client
- Backup otomatis dokumen

## Catatan:
- Pastikan akun Google memiliki storage cukup
- File yang diupload tersimpan di folder khusus notaris
- Client bisa download file melalui link yang dibagikan`,
  },

  // ======================== REPORTS ========================
  {
    title: 'Reports & Analytics',
    category: 'fitur',
    description: 'Cara menggunakan laporan dan analytics',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    content: `# Reports & Analytics (/admin/reports)

## Dashboard Laporan:
- Jumlah dokumen per bulan
- Status dokumen (pie chart)
- Revenue per bulan
- Client baru per bulan
- Appointment completion rate

## Filter Laporan:
- Per periode (harian, mingguan, bulanan, tahunan)
- Per tipe dokumen
- Per staff
- Per cabang

## Export:
- Download laporan dalam format yang tersedia
- Print langsung dari halaman

## Insights:
- Tren pembuatan dokumen
- Performa staff
- Revenue analysis
- Client retention`,
  },
];

async function seedKnowledge() {
  console.log('🌱 Seeding knowledge base...\n');

  for (const item of KNOWLEDGE_ITEMS) {
    // Upsert KB item
    const existing = await prisma.knowledgeBase.findFirst({
      where: { title: item.title },
    });

    let kbId: string;

    if (existing) {
      await prisma.knowledgeBase.update({
        where: { id: existing.id },
        data: {
          content: item.content,
          category: item.category,
          description: item.description,
          allowedRoles: item.allowedRoles,
        },
      });
      kbId = existing.id;
      // Delete old chunks
      await prisma.knowledgeChunk.deleteMany({
        where: { knowledgeBaseId: kbId },
      });
      console.log(`  ♻️  Updated: ${item.title}`);
    } else {
      const created = await prisma.knowledgeBase.create({
        data: {
          title: item.title,
          content: item.content,
          category: item.category,
          description: item.description,
          allowedRoles: item.allowedRoles,
          sourceType: 'manual',
        },
      });
      kbId = created.id;
      console.log(`  ✅  Created: ${item.title}`);
    }

    // Chunk content
    const chunks = chunkText(item.content);
    for (let i = 0; i < chunks.length; i++) {
      await prisma.knowledgeChunk.create({
        data: {
          knowledgeBaseId: kbId,
          chunkIndex: i,
          content: chunks[i],
          allowedRoles: item.allowedRoles,
          metadata: { title: item.title, category: item.category },
        },
      });
    }
    console.log(`     📦 ${chunks.length} chunk(s)`);
  }

  console.log(`\n✨ Done! Seeded ${KNOWLEDGE_ITEMS.length} knowledge items.`);
}

seedKnowledge()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
