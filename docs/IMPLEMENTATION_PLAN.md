# 🗺️ Implementation Plan - Client Portal Notaris

**Versi**: 1.2  
**Tanggal Update**: 11 Februari 2026  
**Berdasarkan**: [Feature Audit Report](./FEATURE_AUDIT.md)

---

## 📋 Prioritas Implementasi

Implementasi dibagi menjadi **5 Phase** berdasarkan severity dan impact terhadap user experience.

---

## 🔴 PHASE 1: Critical Bug Fixes ✅ SELESAI

### ✅ 1.1 Fix PATCH vs PUT Mismatch (BUG-01)

- Ubah method `PATCH` → `PUT` di `documents/[id]/page.tsx`

### ✅ 1.2 Fix documentTypeId defaultValue (BUG-02)

- Ubah defaultValue dari `.name` → `.id`
- API response sekarang include `documentType.id`

---

## 🟠 PHASE 2: Core Missing Features ✅ SELESAI

### ✅ 2.1 File Upload di Form Create/Edit Document (MISS-01)

- Multi-file picker di form Sheet
- Auto-upload ke Google Drive setelah document dibuat
- Progress indicator saat upload

### ✅ 2.2 Implementasi Download File (MISS-02)

- API route: `api/drive/files/[id]/download/route.ts`
- Tombol download di halaman detail dokumen

### ✅ 2.3 Forgot Password + Email Service (MISS-03 & MISS-04)

- Email service: `src/lib/email.ts` (nodemailer + SMTP)
- API: `/api/auth/forgot-password` (generate token, kirim email)
- API: `/api/auth/reset-password` (validasi token, update password)
- Page: `src/app/(auth)/reset-password/page.tsx`
- Updated forgot-password page to call real API

### ✅ 2.4 Reports Page di Frontend (MISS-05)

- Page: `src/app/(dashboard)/admin/reports/page.tsx`
- 4 tabs: Overview, Dokumen, Jadwal, Staff
- Charts: Recharts (Pie + Bar charts)
- Date range filter
- Staff performance table
- Menu "Laporan" ditambahkan di sidebar

### ✅ 2.5 Branch Management CRUD (MISS-06)

- API: `src/app/api/admin/branches/route.ts` (GET, POST)
- API: `src/app/api/admin/branches/[id]/route.ts` (GET, PUT, DELETE)
- Page: `src/app/(dashboard)/admin/branches/page.tsx`
- Menu "Cabang" ditambahkan di sidebar

---

## 🟡 PHASE 3: Feature Completion (Estimasi: 3-4 hari)

### ✅ 3.1 Pagination UI di Documents List (INC-01)

- State: currentPage, totalPages, totalDocuments
- API parameter: page + limit
- UI: Tombol Previous/Next + page numbers
- Auto-reset ke page 1 saat filter berubah

### ✅ 3.2 Required Documents Checklist (INC-02)

- Tampilkan checklist saat memilih jenis dokumen di form create/edit
- Data berasal dari `requiredDocuments` JSON field di DocumentType

**File**: `src/app/(dashboard)/documents/page.tsx` (dalam Sheet form)

**Langkah**:

1. Saat user memilih document type, fetch detail type termasuk `requiredDocuments`
2. Tampilkan checklist "Dokumen yang harus disiapkan"
3. Tampilkan juga di halaman detail dokumen sebagai progress checklist

### ✅ 3.3 Gallery Image Management (INC-03)

- API: `src/app/api/admin/gallery/route.ts` (GET, POST)
- API: `src/app/api/admin/gallery/[id]/route.ts` (PUT, DELETE)
- Page: `src/app/(dashboard)/admin/gallery/page.tsx`
- Menu "Galeri" ditambahkan di sidebar

**Files yang perlu dibuat**:

1. API: `src/app/api/admin/gallery/route.ts` (GET, POST)
2. API: `src/app/api/admin/gallery/[id]/route.ts` (GET, PATCH, DELETE)
3. Page: `src/app/(dashboard)/admin/gallery/page.tsx`
4. Landing Page: Section gallery

### ✅ 3.4 Message Attachments (INC-04)

- File input dengan tombol paperclip di form chat
- Attachment preview strip sebelum kirim
- Support FormData upload (max 10MB per file)
- Tampilan attachment di message bubble (image preview + file download)
- API handle multipart + simpan ke `/uploads/messages/`

### ✅ 3.5 Notification Settings Page (INC-05)

- API: `src/app/api/profile/notification-settings/route.ts` (GET, PUT)
- Page: `src/app/(dashboard)/profile/notifications/page.tsx`
- Toggle email/push/SMS + quiet hours

---

## 🟢 PHASE 4: Enhancement & Polish ✅ SELESAI

### ✅ 4.1 File Type/Size Validation (ENH-02)

- Utility: `src/lib/file-validation.ts`
- Validasi client-side: max file size (25MB docs, 10MB attachments)
- Whitelist file types: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX, GIF, WEBP, TXT
- MIME type verification
- Helper functions: `validateFile()`, `validateFiles()`, `formatFileSize()`

### ✅ 4.2 Real-time Messaging (ENH-03)

- Implementasi: Polling interval 5 detik untuk messages
- Polling interval 15 detik untuk daftar percakapan
- Auto-scroll ke pesan terbaru
- Cleanup interval saat unmount

### ✅ 4.3 Staff Availability Management UI (ENH-04)

- Page: `src/app/(dashboard)/staff/availability/page.tsx`
- API: `src/app/api/staff/availability/route.ts` (GET, POST, PUT)
- Weekly view dengan time slot per hari
- Add/remove/edit slot untuk setiap hari
- Toggle tersedia/tidak tersedia
- Bulk save via PUT
- Menu "Ketersediaan" di sidebar (STAFF, ADMIN, SUPER_ADMIN)

### ✅ 4.4 Konsisten Audit Logging (ENH-05)

- Utility: `src/lib/audit-log.ts` dengan typed actions & entities
- Model AuditLog sudah ada di Prisma schema
- Terintegrasi di document create, update, delete, status change
- IP address tracking dari request headers
- Graceful error handling (tidak break main flow)

---

## 🟣 PHASE 5: Role-Based Dashboard & UX (Estimasi: 4-6 hari)

> **Tujuan**: Setiap role memiliki pengalaman yang berbeda sesuai kebutuhan mereka.

### Analisis Kondisi Saat Ini

| Fitur             | Implementasi Saat Ini                                                           | Masalah                         |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------------- |
| **Sidebar**       | ✅ Menu difilter berdasarkan role                                               | Sudah benar                     |
| **Dashboard**     | ⚠️ Sama untuk semua role, hanya admin dapat cards tambahan (Total Klien, Staff) | Belum optimal per role          |
| **Documents**     | ⚠️ Semua role lihat halaman yang sama, admin bisa create/edit                   | Klien tidak bisa create sendiri |
| **Quick Actions** | ❌ Sama untuk semua role                                                        | Seharusnya berbeda              |
| **Greeting**      | ⚠️ Generic "Selamat datang"                                                     | Tidak mencerminkan role         |

### ✅ 5.1 Dashboard Per Role

- `ClientDashboard`: Tracking dokumen pribadi, notifikasi, quick actions klien
- `StaffDashboard`: Dokumen yang ditugaskan, jadwal hari ini, quick actions staff
- `AdminDashboard`: Overview statistik dengan 7 cards, overdue alert, management actions
- Greeting personalized berdasarkan waktu (pagi/siang/malam)
- API `/api/dashboard` mengembalikan `recentNotifications` + `todayAppointments`

**CLIENT Dashboard** — Fokus: tracking dokumen pribadi

```
┌─────────────────────────────────────────────────────┐
│ Selamat datang, [Nama]                              │
│ Status dokumen Anda                                 │
├──────────┬──────────┬──────────┬───────────┐        │
│ 📄 Total │ ⏳ Proses│ ✅ Selesai│ 📅 Jadwal │        │
│    5     │    2     │    3     │    1      │        │
├──────────┴──────────┴──────────┴───────────┘        │
│                                                     │
│ 📋 Dokumen Saya (terbaru)                           │
│ ┌─ Akta Jual Beli #DOC-001 ... [IN_REVIEW] ──────┐ │
│ └─ Surat Kuasa #DOC-002 ........ [DRAFT] ─────────┘ │
│                                                     │
│ 🔔 Notifikasi Terbaru                               │
│ - Dokumen Anda telah di-review                      │
│ - Jadwal konsultasi besok jam 10:00                  │
│                                                     │
│ ⚡ Aksi Cepat                                       │
│ [📄 Ajukan Dokumen] [📅 Buat Jadwal] [💬 Pesan]     │
└─────────────────────────────────────────────────────┘
```

**STAFF Dashboard** — Fokus: workload & tugas

```
┌─────────────────────────────────────────────────────┐
│ Dashboard Staff - [Nama]                            │
├──────────┬──────────┬──────────┬───────────┐        │
│ 📄 Tugas │ ⏳ Review│ 📅 Jadwal│ 💬 Pesan  │        │
│   12     │    4     │    3     │    2      │        │
├──────────┴──────────┴──────────┴───────────┘        │
│                                                     │
│ 📋 Dokumen yang Ditugaskan (perlu action)            │
│ - [URGENT] Akta Jual Beli - Klien: Budi             │
│ - [HIGH] Surat Kuasa - Klien: Andi                  │
│                                                     │
│ 📅 Jadwal Hari Ini                                   │
│ - 10:00 Konsultasi - Budi                           │
│ - 14:00 Tanda Tangan - Andi                         │
│                                                     │
│ ⚡ Aksi Cepat                                       │
│ [📄 Lihat Tugas] [📅 Jadwal Hari Ini] [💬 Pesan]    │
└─────────────────────────────────────────────────────┘
```

**ADMIN/SUPER_ADMIN Dashboard** — Fokus: overview & management

```
┌─────────────────────────────────────────────────────┐
│ Dashboard Admin                                     │
├────────┬────────┬────────┬────────┬────────┬────────┐
│ 👥 User│ 📄 Doc │ ⏳ Pend│ ✅ Done│ 📅 Appt│ 👨‍💼 Staff│
│   150  │   89   │   12   │   65   │   23   │   8   │
├────────┴────────┴────────┴────────┴────────┴────────┘
│                                                     │
│ 📊 Grafik Dokumen Bulanan (mini chart)              │
│ ▇▇▇▇▇ Jan: 15  ▇▇▇▇▇▇▇ Feb: 22                    │
│                                                     │
│ 📋 Dokumen Terbaru (semua klien)                    │
│ 🔔 Alert: 3 dokumen overdue!                        │
│                                                     │
│ ⚡ Aksi Cepat                                       │
│ [👥 Kelola User] [📊 Laporan] [⚙️ Settings]         │
└─────────────────────────────────────────────────────┘
```

**Implementasi**:

1. Buat komponen: `ClientDashboard`, `StaffDashboard`, `AdminDashboard`
2. Main `DashboardPage` memilih komponen berdasarkan `session.user.role`
3. API `/api/dashboard` mengembalikan data berbeda per role

---

### 5.2 Quick Actions Per Role

| Role            | Quick Actions                                                   |
| --------------- | --------------------------------------------------------------- |
| **CLIENT**      | Ajukan Dokumen Baru, Buat Jadwal, Kirim Pesan, Lihat Notifikasi |
| **STAFF**       | Lihat Tugas, Jadwal Hari Ini, Pesan, Review Dokumen             |
| **ADMIN**       | Kelola User, Laporan, Kelola Dokumen, Settings                  |
| **SUPER_ADMIN** | Semua Admin + Audit Log, System Settings                        |

---

### ✅ 5.3 Document Page Per Role

| Feature               | CLIENT        | STAFF         | ADMIN      | SUPER_ADMIN |
| --------------------- | ------------- | ------------- | ---------- | ----------- |
| Lihat dokumen sendiri | ✅            | ✅ (assigned) | ✅ (semua) | ✅ (semua)  |
| Buat dokumen          | ✅ ("Ajukan") | ✅            | ✅         | ✅          |
| Edit dokumen          | ❌            | ✅ (assigned) | ✅         | ✅          |
| Update status         | ❌            | ✅            | ✅         | ✅          |
| Hapus dokumen         | ❌            | ❌            | ✅         | ✅          |
| Upload file           | ✅            | ✅            | ✅         | ✅          |
| Delete file           | ❌            | ✅            | ✅         | ✅          |
| Download file         | ✅            | ✅            | ✅         | ✅          |
| Assign staff          | ❌            | ❌            | ✅         | ✅          |

**Implementasi**:

- CLIENT: tombol "Ajukan Dokumen", tidak bisa edit/delete
- STAFF: bisa edit dokumen assigned, tidak bisa delete
- ADMIN/SUPER_ADMIN: full access termasuk delete
- Detail page: file delete hanya untuk staff/admin
- API `[id]/route.ts`: role-based PUT field restrictions + admin-only DELETE

---

### 5.4 Appointment Page Per Role

| Feature              | CLIENT   | STAFF         | ADMIN      |
| -------------------- | -------- | ------------- | ---------- |
| Lihat jadwal sendiri | ✅       | ✅ (assigned) | ✅ (semua) |
| Buat jadwal baru     | ✅       | ✅            | ✅         |
| Konfirmasi jadwal    | ❌       | ✅            | ✅         |
| Cancel jadwal        | ✅ (own) | ✅            | ✅         |
| Pilih staff          | ❌       | ❌            | ✅         |

---

### 5.5 Greeting & Personalization

```typescript
// Greeting berdasarkan waktu + role
const getGreeting = (name: string, role: string) => {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';

  const roleLabel = {
    CLIENT: '',
    STAFF: '(Staff)',
    ADMIN: '(Admin)',
    SUPER_ADMIN: '(Super Admin)',
  };

  return `${time}, ${name} ${roleLabel[role]}`;
};
```

---

## 📅 Timeline Rekomendasi (Updated)

```
✅ ALL PHASES COMPLETED:
  ├── Phase 1: BUG-01 & BUG-02 fixed
  ├── Phase 2: File Upload, Download, Forgot Password, Reports, Branches
  ├── Phase 3: Pagination, Notification Settings, Required Docs, Gallery, Message Attachments
  ├── Phase 4: File Validation, Real-time Messaging, Staff Availability, Audit Logging
  └── Phase 5: Dashboard per role, Quick Actions, Greeting, Document & Appointment Permissions
```

**🎉 Semua fitur dalam implementation plan telah selesai!**

---

## 🛠️ Dependencies

| Package             | Kegunaan             | Status       |
| ------------------- | -------------------- | ------------ |
| `nodemailer@^7`     | Email service (SMTP) | ✅ Installed |
| `recharts`          | Charts untuk Reports | ✅ Installed |
| `@types/nodemailer` | TypeScript types     | ✅ Installed |

---

## ✅ Acceptance Criteria

### Phase 1-2 (Completed)

- [x] Status update dari detail dokumen berfungsi (BUG-01)
- [x] Edit dokumen pre-select jenis dokumen yang benar (BUG-02)
- [x] User bisa upload file langsung saat create dokumen
- [x] User bisa download file dari halaman detail
- [x] Forgot password mengirim email yang benar
- [x] Halaman Reports menampilkan statistik lengkap
- [x] Admin bisa mengelola branches
- [x] Pagination berfungsi di documents list

### Phase 3 ✅ SELESAI

- [x] Notification settings page berfungsi
- [x] Required documents checklist muncul saat create dokumen
- [x] Gallery management berfungsi
- [x] Message attachments berfungsi (upload, preview, display)

### Phase 4 ✅ SELESAI

- [x] File validation utility (type + size)
- [x] Real-time messaging (polling 5s messages, 15s conversations)
- [x] Staff availability management (weekly view + API)
- [x] Audit logging konsisten (document CRUD + status changes)

### Phase 5 ✅ SELESAI

- [x] CLIENT dashboard menampilkan dokumen pribadi + tracking
- [x] STAFF dashboard menampilkan tugas yang di-assign + jadwal hari ini
- [x] ADMIN dashboard menampilkan overview statistik + alerts
- [x] Quick actions berbeda per role
- [x] Greeting personalized (waktu + role)
- [x] Document permissions berbeda per role (CLIENT tidak bisa edit/delete)
- [x] STAFF hanya melihat dokumen yang di-assign
- [x] Delete button hanya untuk ADMIN/SUPER_ADMIN
- [x] Appointment permissions per role (CLIENT cancel only pending, STAFF edit, ADMIN full)

---

_Dokumen ini terakhir di-update pada 11 Februari 2026._
