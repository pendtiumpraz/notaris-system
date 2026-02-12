/**
 * Notarial Document JSON Schema & Renderer
 * Converts structured JSON from AI into beautiful, print-ready HTML
 */

// ============================================================
// JSON SCHEMA TYPES
// ============================================================

export interface NotarialDocumentJSON {
  meta: {
    jenisDokumen: string;
    nomorAkta: string;
    tanggal: string; // full date in notarial format
    waktu: string; // e.g. "10.00 WIB"
    notaris: {
      nama: string;
      gelar: string;
      sk: string;
      wilayah: string;
      alamatKantor: string;
    };
  };
  komparisi: KomparisiPihak[];
  premisse: string[];
  pasalPasal: PasalItem[];
  penutup: {
    keterangan: string;
    saksiSaksi: string[];
    tandaTangan: TandaTanganItem[];
  };
  tambahan?: string; // any additional text
}

export interface KomparisiPihak {
  label: string; // e.g. "PIHAK PERTAMA (Penjual)"
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  pekerjaan: string;
  alamat: string;
  nik: string;
  keterangan?: string; // extra info like "selanjutnya disebut..."
}

export interface PasalItem {
  nomor: number;
  judul: string;
  isi: string; // can contain HTML sub-elements
  ayat?: string[]; // sub-clauses
}

export interface TandaTanganItem {
  label: string; // e.g. "Pihak Pertama", "Notaris"
  nama: string;
}

// ============================================================
// DOCUMENT RENDERER
// ============================================================

/**
 * Render a structured notarial document JSON into print-ready HTML
 */
export function renderNotarialDocument(doc: NotarialDocumentJSON): string {
  const sections: string[] = [];

  // ---- DOCUMENT STYLES (inline for print compatibility) ----
  sections.push(`<style>
    .notarial-doc { font-family: 'Times New Roman', 'Georgia', serif; font-size: 12pt; line-height: 2; color: #000; }
    .notarial-doc .doc-title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4pt; }
    .notarial-doc .doc-subtitle { text-align: center; font-size: 12pt; margin-bottom: 2pt; }
    .notarial-doc .doc-number { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 16pt; }
    .notarial-doc .doc-separator { border: none; border-top: 2px solid #000; margin: 12pt 0; }
    .notarial-doc .doc-separator-thin { border: none; border-top: 1px solid #000; margin: 8pt 0; }
    .notarial-doc .section-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 16pt 0 8pt 0; }
    .notarial-doc .pasal-title { font-weight: bold; text-align: center; margin: 16pt 0 8pt 0; font-size: 12pt; }
    .notarial-doc .pasal-judul { font-weight: bold; text-align: center; margin-bottom: 8pt; font-size: 12pt; text-transform: uppercase; }
    .notarial-doc .indent { text-indent: 40pt; text-align: justify; margin-bottom: 4pt; }
    .notarial-doc .no-indent { text-align: justify; margin-bottom: 4pt; }
    .notarial-doc .komparisi-block { margin: 8pt 0; padding-left: 0; }
    .notarial-doc .komparisi-label { font-weight: bold; text-transform: uppercase; margin-bottom: 4pt; }
    .notarial-doc .komparisi-data { margin-left: 20pt; margin-bottom: 2pt; }
    .notarial-doc .ttd-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 40pt; gap: 20pt; }
    .notarial-doc .ttd-box { text-align: center; min-width: 180pt; }
    .notarial-doc .ttd-label { font-size: 11pt; margin-bottom: 60pt; }
    .notarial-doc .ttd-line { border-bottom: 1px solid #000; margin-bottom: 4pt; }
    .notarial-doc .ttd-name { font-weight: bold; font-size: 11pt; }
    .notarial-doc .premisse-item { text-indent: 0; padding-left: 20pt; text-align: justify; margin-bottom: 4pt; position: relative; }
    .notarial-doc .premisse-item::before { content: "- "; position: absolute; left: 0; }
    .notarial-doc .ayat-list { list-style-type: lower-alpha; margin-left: 40pt; margin-bottom: 8pt; }
    .notarial-doc .ayat-list li { margin-bottom: 4pt; text-align: justify; }
  </style>`);

  // ---- HEADER ----
  sections.push(`<div class="notarial-doc">`);

  // Title
  sections.push(`<p class="doc-title">${escapeHtml(doc.meta.jenisDokumen)}</p>`);
  sections.push(`<p class="doc-number">Nomor: ${escapeHtml(doc.meta.nomorAkta)}</p>`);
  sections.push(`<hr class="doc-separator" />`);

  // Date & Notaris info
  sections.push(`<p class="indent">${escapeHtml(doc.meta.tanggal)}</p>`);
  if (doc.meta.waktu) {
    sections.push(`<p class="indent">Pukul ${escapeHtml(doc.meta.waktu)}</p>`);
  }

  // Notaris identification
  const n = doc.meta.notaris;
  sections.push(
    `<p class="indent">Di hadapan saya, <strong>${escapeHtml(n.nama)}${n.gelar ? ', ' + escapeHtml(n.gelar) : ''}</strong>, Notaris berkedudukan di ${escapeHtml(n.wilayah)}, berdasarkan Surat Keputusan ${escapeHtml(n.sk)}, dengan alamat kantor di ${escapeHtml(n.alamatKantor)}, menghadap:</p>`
  );

  sections.push(`<hr class="doc-separator-thin" />`);

  // ---- KOMPARISI ----
  doc.komparisi.forEach((pihak, idx) => {
    sections.push(`<div class="komparisi-block">`);
    sections.push(`<p class="komparisi-label">${escapeHtml(pihak.label)}</p>`);
    sections.push(
      `<p class="komparisi-data">Nama&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>${escapeHtml(pihak.nama)}</strong></p>`
    );
    sections.push(
      `<p class="komparisi-data">Tempat/Tgl Lahir&nbsp;: ${escapeHtml(pihak.tempatLahir)}, ${escapeHtml(pihak.tanggalLahir)}</p>`
    );
    sections.push(
      `<p class="komparisi-data">Pekerjaan&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(pihak.pekerjaan)}</p>`
    );
    sections.push(
      `<p class="komparisi-data">Alamat&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(pihak.alamat)}</p>`
    );
    sections.push(
      `<p class="komparisi-data">NIK&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(pihak.nik)}</p>`
    );
    if (pihak.keterangan) {
      sections.push(`<p class="indent"><em>${escapeHtml(pihak.keterangan)}</em></p>`);
    }
    sections.push(`</div>`);

    if (idx < doc.komparisi.length - 1) {
      sections.push(`<p class="no-indent">&nbsp;</p>`);
    }
  });

  sections.push(`<hr class="doc-separator-thin" />`);

  // ---- PREMISSE ----
  if (doc.premisse && doc.premisse.length > 0) {
    sections.push(`<p class="indent">Para penghadap terlebih dahulu menerangkan:</p>`);
    doc.premisse.forEach((item) => {
      sections.push(`<p class="premisse-item">${escapeHtml(item)}</p>`);
    });
    sections.push(
      `<p class="indent">Berdasarkan hal-hal tersebut di atas, para penghadap sepakat dan setuju untuk membuat perjanjian dengan ketentuan-ketentuan sebagai berikut:</p>`
    );
    sections.push(`<hr class="doc-separator-thin" />`);
  }

  // ---- PASAL-PASAL ----
  doc.pasalPasal.forEach((pasal) => {
    sections.push(`<p class="pasal-title">PASAL ${pasal.nomor}</p>`);
    sections.push(`<p class="pasal-judul">${escapeHtml(pasal.judul)}</p>`);
    // The 'isi' may contain simple HTML, pass it through
    sections.push(`<p class="indent">${pasal.isi}</p>`);

    if (pasal.ayat && pasal.ayat.length > 0) {
      sections.push(`<ol class="ayat-list">`);
      pasal.ayat.forEach((ayat) => {
        sections.push(`<li>${escapeHtml(ayat)}</li>`);
      });
      sections.push(`</ol>`);
    }
  });

  sections.push(`<hr class="doc-separator-thin" />`);

  // ---- PENUTUP ----
  sections.push(`<p class="section-title">PENUTUP</p>`);
  sections.push(`<p class="indent">${escapeHtml(doc.penutup.keterangan)}</p>`);

  if (doc.penutup.saksiSaksi && doc.penutup.saksiSaksi.length > 0) {
    sections.push(`<p class="indent">Akta ini dibuat dan diresmikan dengan dihadiri oleh:</p>`);
    doc.penutup.saksiSaksi.forEach((saksi, i) => {
      sections.push(`<p class="komparisi-data">${i + 1}. ${escapeHtml(saksi)}</p>`);
    });
    sections.push(`<p class="indent">sebagai saksi-saksi.</p>`);
  }

  // ---- TANDA TANGAN ----
  if (doc.penutup.tandaTangan && doc.penutup.tandaTangan.length > 0) {
    sections.push(`<div class="ttd-grid">`);
    doc.penutup.tandaTangan.forEach((ttd) => {
      sections.push(`<div class="ttd-box">`);
      sections.push(`<p class="ttd-label">${escapeHtml(ttd.label)}</p>`);
      sections.push(`<p class="ttd-line">&nbsp;</p>`);
      sections.push(`<p class="ttd-name">${escapeHtml(ttd.nama)}</p>`);
      sections.push(`</div>`);
    });
    sections.push(`</div>`);
  }

  // Additional text
  if (doc.tambahan) {
    sections.push(`<p class="indent">${escapeHtml(doc.tambahan)}</p>`);
  }

  sections.push(`</div>`);

  return sections.join('\n');
}

/**
 * Try to parse AI output as NotarialDocumentJSON
 * Falls back to returning raw HTML if not valid JSON
 */
export function parseAIDocumentOutput(aiContent: string): {
  isStructured: boolean;
  json?: NotarialDocumentJSON;
  html: string;
} {
  // Clean markdown code fences if present
  let cleaned = aiContent.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  cleaned = cleaned.replace(/^```html\s*/i, '').replace(/```\s*$/i, '');

  try {
    const parsed = JSON.parse(cleaned);

    // Validate it has the expected structure
    if (parsed.meta && parsed.komparisi && parsed.pasalPasal && parsed.penutup) {
      const doc = parsed as NotarialDocumentJSON;
      const html = renderNotarialDocument(doc);
      return { isStructured: true, json: doc, html };
    }
  } catch {
    // Not valid JSON — fall through to raw HTML
  }

  // Fall back: treat as raw HTML
  let html = cleaned;
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  return { isStructured: false, html };
}

// ============================================================
// UTILITY
// ============================================================

function escapeHtml(text: string): string {
  if (!text) return '[___________]';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get the JSON schema instruction for the AI prompt
 * This tells the AI exactly what JSON structure to output
 */
export function getJSONSchemaInstruction(): string {
  return `
OUTPUT FORMAT: Kembalikan hasil sebagai JSON yang valid (TANPA code fences, TANPA teks lain) dengan struktur berikut:

{
  "meta": {
    "jenisDokumen": "AKTA JUAL BELI",
    "nomorAkta": "[NOMOR_AKTA]",
    "tanggal": "Pada hari Rabu, tanggal dua belas bulan Februari tahun dua ribu dua puluh enam (12-02-2026)",
    "waktu": "10.00 WIB",
    "notaris": {
      "nama": "[NAMA_NOTARIS]",
      "gelar": "S.H., M.Kn.",
      "sk": "Surat Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia Nomor [NOMOR_SK]",
      "wilayah": "[KOTA_KEDUDUKAN]",
      "alamatKantor": "[ALAMAT_KANTOR]"
    }
  },
  "komparisi": [
    {
      "label": "PIHAK PERTAMA (Penjual)",
      "nama": "[NAMA_LENGKAP]",
      "tempatLahir": "[KOTA]",
      "tanggalLahir": "[DD-MM-YYYY]",
      "pekerjaan": "[PEKERJAAN]",
      "alamat": "[ALAMAT_LENGKAP]",
      "nik": "[NIK_16_DIGIT]",
      "keterangan": "selanjutnya dalam akta ini disebut sebagai PIHAK PERTAMA"
    }
  ],
  "premisse": [
    "Bahwa Pihak Pertama adalah pemilik sah atas sebidang tanah...",
    "Bahwa Pihak Pertama bermaksud untuk menjual..."
  ],
  "pasalPasal": [
    {
      "nomor": 1,
      "judul": "OBJEK JUAL BELI",
      "isi": "Pihak Pertama dengan ini menjual dan menyerahkan kepada Pihak Kedua...",
      "ayat": [
        "Sebidang tanah seluas ... meter persegi",
        "Dengan batas-batas sebagai berikut: Utara: ..., Selatan: ..., Timur: ..., Barat: ..."
      ]
    }
  ],
  "penutup": {
    "keterangan": "Demikian akta ini dibuat dan diresmikan di [KOTA], pada hari dan tanggal tersebut pada bagian awal akta ini, dengan dihadiri oleh para saksi yang telah dikenal oleh saya, Notaris.",
    "saksiSaksi": ["[NAMA_SAKSI_1], [PEKERJAAN], beralamat di [ALAMAT]", "[NAMA_SAKSI_2], [PEKERJAAN], beralamat di [ALAMAT]"],
    "tandaTangan": [
      {"label": "Pihak Pertama", "nama": "[NAMA]"},
      {"label": "Pihak Kedua", "nama": "[NAMA]"},
      {"label": "Saksi 1", "nama": "[NAMA_SAKSI_1]"},
      {"label": "Saksi 2", "nama": "[NAMA_SAKSI_2]"},
      {"label": "Notaris", "nama": "[NAMA_NOTARIS], S.H., M.Kn."}
    ]
  }
}

PENTING:
- Gunakan placeholder [TANDA_KURUNG] untuk data yang belum diketahui
- Jika data klien sudah diberikan, isi dengan data tersebut
- Pastikan setiap pasal isinya substansial dan sesuai hukum yang berlaku
- JSON harus valid dan bisa di-parse
- JANGAN tambahkan teks apapun di luar JSON`;
}
