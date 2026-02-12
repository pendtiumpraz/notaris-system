/**
 * AI Document Service
 * Handles AI-powered document operations: generate, analyze, correct, revise, summarize, translate, letter
 */

import { getProvider, type AISettings } from './ai-providers';
import { prisma } from './prisma';
import { parseAIDocumentOutput, getJSONSchemaInstruction } from './notarial-document-renderer';

const AI_SETTINGS_KEY = 'ai_provider_settings';

export type AIDocumentAction =
  | 'generate'
  | 'analyze'
  | 'correct'
  | 'revise'
  | 'summarize'
  | 'translate'
  | 'letter';

interface AIDocumentRequest {
  action: AIDocumentAction;
  documentType: string;
  title: string;
  content?: string; // existing content for analyze/correct/revise
  instruction?: string; // user instruction for revise
  clientName?: string;
  clientAddress?: string;
  additionalContext?: string;
  letterType?: string; // for letter generation: undangan, pemberitahuan, kuasa, etc.
  targetLanguage?: string; // for translate
}

interface AIDocumentResponse {
  success: boolean;
  content?: string;
  analysis?: string;
  error?: string;
  aiResultId?: string;
  durationMs?: number;
  structuredJson?: unknown;
  isStructured?: boolean;
}

/**
 * Document-type-specific legal structure guidance
 */
function getDocumentTypeGuidance(documentType: string): string {
  const dt = documentType.toLowerCase();

  // Akta Jual Beli (AJB)
  if (dt.includes('jual beli') || dt.includes('ajb')) {
    return `
STRUKTUR KHUSUS AKTA JUAL BELI (AJB):
Dasar Hukum: Pasal 1457-1540 KUHPerdata, PP No. 24 Tahun 1997
1. Kepala Akta: Judul "AKTA JUAL BELI", nomor akta, tanggal (dalam huruf), waktu WIB, nama notaris/PPAT dan wilayah kerja
2. Komparisi: Identitas lengkap PENJUAL (Pihak Pertama) dan PEMBELI (Pihak Kedua) — nama, tempat/tanggal lahir, pekerjaan, alamat, NIK, dasar kuasa (jika mewakili)
3. Premisse: Penjelasan latar belakang, dasar kepemilikan (sertifikat, nomor, luas, batas-batas), riwayat hak
4. Isi Akta:
   - Pasal 1: Objek Jual Beli (deskripsi tanah/bangunan, SHM/SHGB nomor, luas, batas-batas utara/selatan/timur/barat)
   - Pasal 2: Harga dan Cara Pembayaran
   - Pasal 3: Penyerahan (levering)
   - Pasal 4: Jaminan Penjual (bebas sengketa, tidak dalam jaminan, bebas sitaan)
   - Pasal 5: Biaya-biaya (PPh, BPHTB, biaya AJB, balik nama)
   - Pasal 6: Kuasa Balik Nama
   - Pasal 7: Domisili Hukum
5. Penutup Akta: keterangan pembacaan, persetujuan penghadap, tanda tangan, saksi-saksi`;
  }

  // Perjanjian Pengikatan Jual Beli (PPJB)
  if (
    dt.includes('ppjb') ||
    dt.includes('pengikatan jual beli') ||
    dt.includes('perjanjian pengikatan')
  ) {
    return `
STRUKTUR KHUSUS PERJANJIAN PENGIKATAN JUAL BELI (PPJB):
Dasar Hukum: Pasal 1457 jo. 1458 KUHPerdata, UU No. 1 Tahun 2011 tentang Perumahan
1. Kepala Akta: nomor, tanggal, nama notaris
2. Komparisi: identitas lengkap Calon Penjual dan Calon Pembeli
3. Premisse: keterangan objek, status tanah (HGB/HM), izin-izin terkait
4. Isi:
   - Pasal 1: Objek PPJB
   - Pasal 2: Harga dan Tahapan Pembayaran (termin/cicilan)
   - Pasal 3: Penandatanganan AJB (jangka waktu dan syarat)
   - Pasal 4: Serah Terima Fisik
   - Pasal 5: Jaminan dan Pernyataan
   - Pasal 6: Denda Keterlambatan
   - Pasal 7: Pembatalan dan Penalti
   - Pasal 8: Force Majeure
   - Pasal 9: Penyelesaian Sengketa
   - Pasal 10: Domisili Hukum
5. Penutup`;
  }

  // Surat Kuasa
  if (dt.includes('kuasa') || dt.includes('power of attorney')) {
    return `
STRUKTUR KHUSUS AKTA KUASA:
Dasar Hukum: Pasal 1792-1819 KUHPerdata
1. Kepala Akta: "SURAT KUASA" atau "AKTA KUASA", nomor, tanggal, notaris
2. Komparisi: identitas lengkap Pemberi Kuasa dan Penerima Kuasa
3. Premisse: alasan pemberian kuasa
4. Isi Kuasa:
   - Ruang lingkup kuasa (khusus/umum)
   - Wewenang yang diberikan (rinci dan spesifik)
   - Hak substitusi (apakah boleh dilimpahkan)
   - Jangka waktu berlaku
   - Pembatasan kuasa (jika ada)
   - Klausul "Kuasa ini tidak dapat ditarik kembali" (jika irrevocable — sesuai Pasal 1813 KUHPerdata)
5. Penutup: keterangan pembacaan di hadapan notaris, tanda tangan`;
  }

  // Pendirian PT
  if (
    dt.includes('pendirian pt') ||
    dt.includes('perseroan terbatas') ||
    dt.includes('anggaran dasar')
  ) {
    return `
STRUKTUR KHUSUS AKTA PENDIRIAN PERSEROAN TERBATAS:
Dasar Hukum: UU No. 40 Tahun 2007 tentang Perseroan Terbatas (UUPT), khususnya Pasal 7-14
1. Kepala Akta
2. Komparisi: identitas lengkap seluruh Pendiri (min. 2 orang/badan hukum per Pasal 7 UUPT)
3. Premisse: maksud pendirian PT
4. ANGGARAN DASAR:
   - Pasal 1: Nama dan Tempat Kedudukan
   - Pasal 2: Jangka Waktu Berdiri
   - Pasal 3: Maksud, Tujuan, dan Kegiatan Usaha (sesuai KBLI)
   - Pasal 4: Modal Dasar, Modal Ditempatkan, Modal Disetor (min. 25% per Pasal 33 UUPT)
   - Pasal 5: Saham (nilai nominal, klasifikasi, hak pemegang saham)
   - Pasal 6: Pemindahan Hak atas Saham
   - Pasal 7: Direksi (jumlah, pengangkatan, tugas, wewenang per Pasal 92-107 UUPT)
   - Pasal 8: Dewan Komisaris (jumlah, pengangkatan, tugas per Pasal 108-121 UUPT)
   - Pasal 9: RUPS (RUPS Tahunan, RUPS Luar Biasa, kuorum per Pasal 75-91 UUPT)
   - Pasal 10: Tahun Buku dan Laporan Tahunan
   - Pasal 11: Penggunaan Laba dan Dividen
   - Pasal 12: Pembubaran dan Likuidasi
5. Susunan Pengurus Pertama (Direksi dan Komisaris)
6. Penutup`;
  }

  // Perjanjian Kredit / Fidusia
  if (dt.includes('fidusia') || dt.includes('jaminan fidusia') || dt.includes('kredit')) {
    return `
STRUKTUR KHUSUS AKTA JAMINAN FIDUSIA:
Dasar Hukum: UU No. 42 Tahun 1999 tentang Jaminan Fidusia
1. Kepala Akta
2. Komparisi: identitas Pemberi Fidusia (Debitur) dan Penerima Fidusia (Kreditur)
3. Premisse: dasar perjanjian kredit/pokok yang dijamin
4. Isi:
   - Pasal 1: Objek Jaminan Fidusia (uraian lengkap benda yang dijaminkan per Pasal 6 UU Fidusia)
   - Pasal 2: Nilai Penjaminan dan Nilai Objek
   - Pasal 3: Ruang Lingkup Utang yang Dijamin
   - Pasal 4: Kewajiban Pemberi Fidusia (memelihara, mengasuransikan, tidak mengalihkan)
   - Pasal 5: Cidera Janji (events of default)
   - Pasal 6: Eksekusi (hak eksekutorial per Pasal 29 UU Fidusia)
   - Pasal 7: Pendaftaran Fidusia (wajib per Pasal 11 UU Fidusia)
   - Pasal 8: Asuransi atas Objek Fidusia
5. Penutup`;
  }

  // Hak Tanggungan
  if (dt.includes('hak tanggungan') || dt.includes('apht') || dt.includes('skmht')) {
    return `
STRUKTUR KHUSUS AKTA PEMBERIAN HAK TANGGUNGAN (APHT):
Dasar Hukum: UU No. 4 Tahun 1996 tentang Hak Tanggungan (UUHT)
1. Kepala Akta
2. Komparisi: identitas Pemberi Hak Tanggungan dan Penerima/Pemegang Hak Tanggungan
3. Premisse: dasar hubungan hutang-piutang, SKMHT (jika ada)
4. Isi (wajib per Pasal 11 UUHT):
   - Nama dan identitas pemberi dan pemegang Hak Tanggungan
   - Domisili pihak-pihak
   - Penunjukan secara jelas utang yang dijamin
   - Nilai tanggungan
   - Uraian objek Hak Tanggungan (deskripsi tanah/sertifikat)
   - Janji-janji (Pasal 11 ayat (2) UUHT): tidak menyewakan, hak menjual atas kekuasaan sendiri, dll.
5. Penutup`;
  }

  // Yayasan
  if (dt.includes('yayasan')) {
    return `
STRUKTUR KHUSUS AKTA PENDIRIAN YAYASAN:
Dasar Hukum: UU No. 16 Tahun 2001 jo. UU No. 28 Tahun 2004 tentang Yayasan
1. Kepala Akta
2. Komparisi: identitas Pendiri
3. Anggaran Dasar:
   - Pasal 1: Nama dan Tempat Kedudukan
   - Pasal 2: Jangka Waktu (tidak terbatas umumnya)
   - Pasal 3: Maksud dan Tujuan (sosial, keagamaan, atau kemanusiaan per Pasal 1 angka 1 UU Yayasan)
   - Pasal 4: Kegiatan
   - Pasal 5: Kekayaan Awal (dari harta kekayaan yang dipisahkan)
   - Pasal 6: Organ Yayasan: Pembina, Pengurus, Pengawas
   - Pasal 7: Pembina (kewenangan per Pasal 28)
   - Pasal 8: Pengurus (tugas per Pasal 35)
   - Pasal 9: Pengawas (tugas per Pasal 40)
   - Pasal 10: Tahun Buku dan Laporan
   - Pasal 11: Perubahan Anggaran Dasar
   - Pasal 12: Pembubaran
4. Susunan Organ Pertama
5. Penutup`;
  }

  // Wasiat
  if (dt.includes('wasiat') || dt.includes('testament')) {
    return `
STRUKTUR KHUSUS AKTA WASIAT (TESTAMENT):
Dasar Hukum: Pasal 875-1004 KUHPerdata, Pasal 16 UUJN
1. Kepala Akta: "AKTA WASIAT" / "TESTAMENT", nomor akta
2. Komparisi: identitas lengkap Pewaris/Pewasiat (testateur) — pastikan dalam keadaan sehat jasmani dan rohani serta cakap hukum
3. Isi Wasiat:
   - Pencabutan wasiat-wasiat terdahulu (jika ada)
   - Penunjukan Ahli Waris (erfgenaam)
   - Hibah Wasiat (legaat) — benda-benda tertentu
   - Pengangkatan Pelaksana Wasiat (executeur testamentair) jika ada
   - Ketentuan tentang Legitime Portie (bagian mutlak ahli waris per Pasal 913 KUHPerdata)
   - Syarat-syarat khusus (jika ada)
4. Penutup: keterangan dibacakan di hadapan notaris, pewasiat sehat pikiran, saksi-saksi`;
  }

  // Perjanjian Sewa
  if (dt.includes('sewa') || dt.includes('lease') || dt.includes('rental')) {
    return `
STRUKTUR KHUSUS AKTA/PERJANJIAN SEWA MENYEWA:
Dasar Hukum: Pasal 1548-1600 KUHPerdata
1. Identitas Para Pihak: Pihak Yang Menyewakan dan Pihak Penyewa
2. Isi:
   - Pasal 1: Objek Sewa (uraian bangunan/tanah, alamat, luas)
   - Pasal 2: Jangka Waktu Sewa
   - Pasal 3: Harga Sewa dan Cara Pembayaran
   - Pasal 4: Peruntukan
   - Pasal 5: Pemeliharaan dan Perbaikan
   - Pasal 6: Larangan Mengalihkan/Menyewakan Ulang (sub-lease)
   - Pasal 7: Serah Terima
   - Pasal 8: Pengembalian
   - Pasal 9: Force Majeure
   - Pasal 10: Penyelesaian Sengketa`;
  }

  // Perjanjian Kerjasama
  if (dt.includes('kerjasama') || dt.includes('mou') || dt.includes('cooperation')) {
    return `
STRUKTUR KHUSUS PERJANJIAN KERJASAMA:
Dasar Hukum: Pasal 1313 jo. Pasal 1338 KUHPerdata (kebebasan berkontrak)
1. Identitas Para Pihak
2. Recital/Premisse: latar belakang kerjasama
3. Isi:
   - Pasal 1: Definisi dan Istilah
   - Pasal 2: Ruang Lingkup Kerjasama
   - Pasal 3: Hak dan Kewajiban Para Pihak
   - Pasal 4: Jangka Waktu
   - Pasal 5: Pembagian Keuntungan/Biaya
   - Pasal 6: Kerahasiaan (NDA)
   - Pasal 7: Hak Kekayaan Intelektual
   - Pasal 8: Force Majeure
   - Pasal 9: Pengakhiran Perjanjian
   - Pasal 10: Penyelesaian Sengketa
   - Pasal 11: Ketentuan Lain-lain`;
  }

  // Surat Keterangan / Covernote
  if (dt.includes('keterangan') || dt.includes('covernote') || dt.includes('surat keterangan')) {
    return `
STRUKTUR SURAT KETERANGAN / COVERNOTE NOTARIS:
1. Kop Surat Notaris (nama, SK, alamat, telepon)
2. Nomor Surat, Lampiran, Perihal
3. Badan Surat:
   - Keterangan identitas notaris
   - "Dengan ini menerangkan bahwa..."
   - Uraian fakta yang diterangkan (proses yang sedang berjalan, dokumen yang telah dibuat)
   - Jaminan/pernyataan notaris
4. Penutup
5. Tanda tangan, nama, stempel, dan cap notaris`;
  }

  // Default / Generic
  return `
STRUKTUR UMUM DOKUMEN NOTARIS:
1. Kepala Akta: judul, nomor akta, tanggal (hari, tanggal, bulan, tahun dalam huruf), waktu (WIB), nama notaris lengkap dengan SK pengangkatan, wilayah kedudukan
2. Badan Akta:
   a. Komparisi: identitas lengkap setiap penghadap (nama, tempat lahir, tanggal lahir, pekerjaan, alamat, NIK)
   b. Premisse: penjelasan latar belakang dan dasar hukum
   c. Isi akta: pasal-pasal yang mengatur hak, kewajiban, dan ketentuan
3. Akhir/Penutup Akta: tempat penandatanganan, keterangan pembacaan oleh notaris, persetujuan penghadap, saksi-saksi (minimal 2 orang), tanda tangan semua pihak`;
}

/**
 * Get the system prompt based on document action
 */
function getSystemPrompt(action: AIDocumentAction, documentType?: string): string {
  const basePrompt = `Kamu adalah Notaris & PPAT virtual profesional Indonesia yang ahli dalam pembuatan dan analisis dokumen hukum.

DASAR HUKUM UTAMA:
- Undang-Undang Nomor 2 Tahun 2014 tentang Perubahan atas UU No. 30 Tahun 2004 tentang Jabatan Notaris (UUJN)
- Kitab Undang-Undang Hukum Perdata (KUHPerdata/BW)
- PP No. 24 Tahun 2016 tentang Perubahan atas PP No. 37 Tahun 1998 tentang Peraturan Jabatan PPAT
- UU No. 5 Tahun 1960 tentang Peraturan Dasar Pokok-Pokok Agraria (UUPA)

KONVENSI BAHASA NOTARIS:
- Gunakan istilah hukum standar: "penghadap" (bukan "pihak yang datang"), "menghadap" (bukan "datang ke"), "berkedudukan" (bukan "beralamat di"), "turut hadir" (untuk saksi)
- Tanggal ditulis lengkap dalam huruf: "pada hari Senin, tanggal dua belas bulan Februari tahun dua ribu dua puluh enam (12-02-2026)"
- Angka penting ditulis dua kali: dalam huruf dan angka, contoh: "sebesar seratus juta Rupiah (Rp100.000.000,00)"
- Gunakan singkatan standar: WIB, NIK, KTP, SHM, SHGB, NOP, PBB, BPHTB, PPh
- Setiap akta penomoran pasal menggunakan: PASAL 1, PASAL 2, dst.
- Bahasa formal, lugas, tidak ambigu, kalimat hukum yang presisi

KEPATUHAN UU PDP (UU No. 27 Tahun 2022):
- JANGAN menyimpan atau menampilkan data biometrik
- Minimasi data: hanya gunakan data yang diperlukan
- Semua data bersifat rahasia dan hanya untuk keperluan pembuatan dokumen
- JANGAN membuat asumsi tentang data pribadi yang tidak diberikan`;

  const docGuidance = documentType ? getDocumentTypeGuidance(documentType) : '';

  switch (action) {
    case 'generate':
      return `${basePrompt}

TUGAS: Buatkan draft dokumen notaris lengkap dalam format JSON terstruktur.
${docGuidance}

ATURAN:
- Pastikan setiap pasal memiliki substansi hukum yang benar dan lengkap sesuai undang-undang yang berlaku
- Jika info klien tersedia, isi data komparisi. Jika tidak, gunakan placeholder [TANDA_KURUNG]
- Minimal 5-10 pasal yang substansial sesuai jenis dokumen
- Setiap pasal harus memiliki isi yang detail dan lengkap, bukan hanya judul
- Gunakan bahasa notaris standar Indonesia

${getJSONSchemaInstruction()}`;

    case 'analyze':
      return `${basePrompt}

TUGAS: Analisis dokumen notaris yang diberikan secara mendalam.
${docGuidance}

BERIKAN ANALISIS BERIKUT:
1. **Ringkasan** — Ringkasan singkat substansi dokumen
2. **Kelengkapan Formal** — Periksa apakah memenuhi Pasal 38 UUJN (kepala akta, badan akta, akhir akta)
3. **Kelengkapan Substansial** — Apakah semua pasal/klausul yang diperlukan untuk jenis dokumen ini sudah ada
4. **Potensi Masalah Hukum** — Identifikasi klausul yang lemah, ambigu, atau bertentangan dengan UU
5. **Kebenaran Referensi UU** — Apakah dasar hukum yang dikutip sudah benar dan masih berlaku
6. **Saran Perbaikan** — Rekomendasi spesifik dan konkret
7. **Risiko** — Tingkat risiko (Rendah/Sedang/Tinggi) dan penjelasan

Format jawaban dalam HTML dengan heading dan list yang rapi. Gunakan warna: hijau untuk "baik", kuning untuk "perlu perbaikan", merah untuk "bermasalah".`;

    case 'correct':
      return `${basePrompt}

TUGAS: Perbaiki dokumen notaris berikut agar sesuai standar penulisan notariat Indonesia.
${docGuidance}

YANG HARUS DIPERBAIKI:
- Kesalahan ketik (typo) dan tata bahasa Indonesia
- Penulisan tanggal harus dalam huruf dan angka: "tanggal dua belas bulan Februari tahun dua ribu dua puluh enam (12-02-2026)"
- Penulisan angka/nominal harus dua kali: huruf dan angka, contoh: "sebesar lima puluh juta Rupiah (Rp50.000.000,00)"
- Istilah hukum yang tidak standar (contoh: "pihak" → "penghadap", "tanda tangan" → "tandatangan")
- Konsistensi penyebutan para pihak (Pihak Pertama/Kedua vs nama)
- Penomoran pasal yang tidak urut
- Struktur kalimat hukum yang ambigu
- Format sertifikat, NIK, NPWP yang tidak standar

KEMBALIKAN dokumen yang sudah diperbaiki dalam format HTML yang sama.
JANGAN mengubah substansi hukum dokumen, hanya perbaiki format, bahasa, dan konsistensi.
Berikan output HTML langsung tanpa penjelasan tambahan.`;

    case 'revise':
      return `${basePrompt}

TUGAS: Revisi dokumen notaris berdasarkan instruksi yang diberikan.
${docGuidance}

ATURAN:
- Ikuti instruksi revisi dengan tepat
- Pertahankan format HTML dan struktur dokumen yang ada
- Pastikan hasil revisi tetap konsisten secara hukum dan sesuai UU yang berlaku
- Jika instruksi revisi berpotensi melanggar hukum, TOLAK dan jelaskan alasannya
- Jika instruksi tidak jelas, tetap pertahankan versi yang aman secara hukum
- Pastikan penomoran tetap urut setelah revisi

Kembalikan dokumen yang sudah direvisi dalam format HTML.
Berikan output HTML langsung tanpa penjelasan lain.`;

    case 'summarize':
      return `${basePrompt}

TUGAS: Buatkan ringkasan dokumen notaris yang diberikan.
ATURAN:
- Ringkasan harus mencakup:
  • Jenis dan nomor akta
  • Tanggal pembuatan akta
  • Nama notaris pembuat
  • Identitas pihak-pihak yang terlibat
  • Objek/hal yang diperjanjikan
  • Ketentuan-ketentuan pokok (harga, jangka waktu, kewajiban utama)
  • Hak dan kewajiban masing-masing pihak
  • Klausul-klausul khusus (force majeure, penyelesaian sengketa, dll.)
  • Tanggal berlaku dan berakhir
- Maksimal 8-12 poin utama
- Format dalam HTML dengan heading dan bullet list yang rapi
- Tulis ringkasan yang bisa dipahami orang awam namun tetap akurat secara hukum`;

    case 'translate':
      return `You are a certified legal translator specializing in Indonesian notarial documents with expertise in both Indonesian and English legal systems.

TASK: Translate the given Indonesian notarial document to ${documentType === 'English' ? 'English' : 'the target language'}.
RULES:
- Maintain the exact same HTML structure and formatting
- Use proper English legal terminology (e.g., "penghadap" → "appearer", "akta" → "deed", "pihak" → "party")
- Keep proper nouns (names, places, addresses) in their original form
- Annotate Indonesian legal terms that have no direct English equivalent in brackets, e.g., [Akta Jual Beli - Sale and Purchase Deed]
- Preserve all numbering, dates, and monetary values
- Convert currency format: "Rp" remains as "IDR" with original amount
- Add header: "[UNOFFICIAL TRANSLATION - FOR REFERENCE ONLY]"
- Add footer: "[This is an unofficial translation. The original Indonesian version shall prevail in case of any discrepancy.]"
- Output HTML directly without any explanation`;

    case 'letter':
      return `${basePrompt}

TUGAS: Buatkan surat resmi notaris dalam format HTML.
JENIS-JENIS SURAT NOTARIS:
- Surat Keterangan Notaris
- Covernote
- Surat Pemberitahuan kepada instansi (BPN, Kantor Pajak, dll.)
- Surat Undangan RUPS
- Surat Kuasa (di bawah tangan)
- Surat Pernyataan
- Surat Pengantar ke Bank/Instansi

ATURAN:
- Kop Surat: nama notaris lengkap dengan gelar, nomor SK Menkumham, wilayah kedudukan, alamat kantor, telepon, email (gunakan placeholder jika belum diketahui)
- Nomor surat: format [NOMOR_SURAT]/[BULAN_ROMAWI]/[TAHUN]
- Lampiran: sebutkan jika ada
- Perihal: jelas dan singkat
- Kepada Yth.: nama dan jabatan penerima
- Badan Surat: bahasa Indonesia formal, sopan, dan jelas
- Penutup: "Demikian surat ini kami buat untuk dapat dipergunakan sebagaimana mestinya."
- Tanda tangan: nama notaris, stempel, dan cap
- Format siap cetak A4
- JANGAN gunakan markdown, HANYA HTML`;

    default:
      return basePrompt;
  }
}

/**
 * Build user prompt based on action and request
 */
function getUserPrompt(req: AIDocumentRequest): string {
  switch (req.action) {
    case 'generate':
      return `Buatkan draft dokumen "${req.documentType}" dengan judul: "${req.title}".

${req.clientName ? `Nama klien: ${req.clientName}` : ''}
${req.clientAddress ? `Alamat klien: ${req.clientAddress}` : ''}
${req.additionalContext ? `Konteks tambahan: ${req.additionalContext}` : ''}

Buatkan dokumen lengkap dalam format HTML.`;

    case 'analyze':
      return `Analisis dokumen berikut:

Jenis: ${req.documentType}
Judul: ${req.title}

ISI DOKUMEN:
${req.content || '(kosong)'}`;

    case 'correct':
      return `Perbaiki dokumen berikut:

Jenis: ${req.documentType}
Judul: ${req.title}

ISI DOKUMEN:
${req.content || '(kosong)'}`;

    case 'revise':
      return `Revisi dokumen berikut sesuai instruksi:

INSTRUKSI REVISI: ${req.instruction || 'Tidak ada instruksi spesifik'}

Jenis: ${req.documentType}
Judul: ${req.title}

ISI DOKUMEN:
${req.content || '(kosong)'}`;

    case 'summarize':
      return `Buatkan ringkasan dari dokumen berikut:

Jenis: ${req.documentType}
Judul: ${req.title}

ISI DOKUMEN:
${req.content || '(kosong)'}`;

    case 'translate':
      return `Translate the following Indonesian notarial document to ${req.targetLanguage || 'English'}:

Document Type: ${req.documentType}
Title: ${req.title}

DOCUMENT CONTENT:
${req.content || '(empty)'}`;

    case 'letter':
      return `Buatkan surat resmi notaris dengan detail berikut:

Jenis Surat: ${req.letterType || 'Surat Pemberitahuan'}
Perihal: ${req.title}
${req.clientName ? `Ditujukan kepada: ${req.clientName}` : ''}
${req.clientAddress ? `Alamat: ${req.clientAddress}` : ''}
${req.additionalContext ? `Detail tambahan: ${req.additionalContext}` : ''}

Buatkan surat lengkap dalam format HTML.`;

    default:
      return '';
  }
}

/**
 * Call AI provider for document operations
 * Saves result to ai_results table for audit trail
 */
export async function callAIForDocument(
  req: AIDocumentRequest,
  userId?: string,
  documentId?: string
): Promise<AIDocumentResponse> {
  const startTime = Date.now();

  try {
    // Fetch AI settings
    const setting = await prisma.siteSettings.findUnique({
      where: { key: AI_SETTINGS_KEY },
    });

    if (!setting) {
      return { success: false, error: 'AI belum dikonfigurasi. Silakan setup di AI Settings.' };
    }

    const settings: AISettings = JSON.parse(setting.value);
    const provider = getProvider(settings.activeProviderId);

    if (!provider) {
      return { success: false, error: `Provider "${settings.activeProviderId}" tidak ditemukan.` };
    }

    const providerConfig = settings.providers[settings.activeProviderId];
    if (!providerConfig?.apiKey) {
      return { success: false, error: `API Key untuk ${provider.name} belum dikonfigurasi.` };
    }

    const completionUrl = `${provider.baseUrl}${provider.completionPath}`;
    const systemPrompt = getSystemPrompt(req.action, req.documentType);
    const userPrompt = getUserPrompt(req);

    const response = await fetch(completionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [provider.authHeader]: `${provider.authPrefix}${providerConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.activeModelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 8192,
        temperature: req.action === 'correct' ? 0.2 : 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error (${response.status}): ${errorText.substring(0, 300)}`,
      };
    }

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || '';
    const tokensUsed = result.usage?.total_tokens || null;
    const durationMs = Date.now() - startTime;

    // For 'generate' action, try to parse JSON and render
    let finalContent = aiContent;
    let structuredJson: unknown = undefined;
    let isStructured = false;

    if (req.action === 'generate') {
      const parsed = parseAIDocumentOutput(aiContent);
      finalContent = parsed.html;
      structuredJson = parsed.json;
      isStructured = parsed.isStructured;
    }

    // Save to database (audit trail)
    let aiResultId: string | undefined;
    if (userId) {
      try {
        const saved = await prisma.aIResult.create({
          data: {
            documentId: documentId || null,
            userId,
            action: req.action,
            prompt: userPrompt.substring(0, 5000), // Limit prompt size
            result: req.action === 'generate' ? finalContent : aiContent,
            provider: settings.activeProviderId,
            model: settings.activeModelId,
            tokensUsed,
            durationMs,
            metadata: {
              documentType: req.documentType,
              title: req.title,
              letterType: req.letterType,
              targetLanguage: req.targetLanguage,
              isStructured,
              ...(isStructured && structuredJson
                ? { structuredJson: JSON.parse(JSON.stringify(structuredJson)) }
                : {}),
            },
          },
        });
        aiResultId = saved.id;
      } catch (dbError) {
        console.error('Failed to save AI result to DB:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    if (req.action === 'analyze' || req.action === 'summarize') {
      return { success: true, analysis: aiContent, aiResultId, durationMs };
    }

    if (req.action === 'generate') {
      return {
        success: true,
        content: finalContent,
        aiResultId,
        durationMs,
        structuredJson,
        isStructured,
      };
    }

    return { success: true, content: aiContent, aiResultId, durationMs };
  } catch (error) {
    console.error('AI Document error:', error);
    return {
      success: false,
      error: `Gagal menghubungi AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - startTime,
    };
  }
}
