/**
 * AI Document Service
 * Handles AI-powered document operations: generate, analyze, correct, revise, summarize, translate, letter
 */

import { getProvider, type AISettings } from './ai-providers';
import { prisma } from './prisma';

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
}

/**
 * Get the system prompt based on document action
 */
function getSystemPrompt(action: AIDocumentAction): string {
  const basePrompt = `Kamu adalah asisten notaris profesional Indonesia yang ahli dalam membuat dan menganalisis dokumen hukum.
Kamu menulis dalam Bahasa Indonesia yang formal dan sesuai dengan standar hukum Indonesia.
Selalu gunakan format yang benar untuk dokumen notaris termasuk nomor akta, tanggal, identitas pihak, dan pasal-pasal.

KEPATUHAN UU PDP (UU No. 27 Tahun 2022):
- JANGAN menyimpan atau menampilkan data biometrik
- Minimasi data: hanya gunakan data yang diperlukan untuk tugas ini
- Semua data bersifat rahasia dan hanya untuk keperluan pembuatan dokumen
- JANGAN membuat asumsi tentang data pribadi yang tidak diberikan`;

  switch (action) {
    case 'generate':
      return `${basePrompt}

TUGAS: Buatkan draft dokumen notaris lengkap dalam format HTML.
ATURAN:
- Gunakan format HTML yang bersih dengan tag <h1>, <h2>, <p>, <ol>, <ul>, <table>
- Sertakan header dokumen dengan nomor akta, tanggal, dan tempat
- Sertakan identitas pihak-pihak yang terlibat (gunakan placeholder [NAMA], [ALAMAT], dll.)
- Sertakan pasal-pasal yang relevan sesuai jenis dokumen
- Sertakan bagian penutup dan tanda tangan
- Gunakan CSS inline minimal (text-align, font-weight, margin)
- Format harus siap cetak di kertas A4
- JANGAN gunakan markdown, HANYA HTML`;

    case 'analyze':
      return `${basePrompt}

TUGAS: Analisis dokumen notaris yang diberikan.
BERIKAN:
1. **Ringkasan** - Ringkasan singkat isi dokumen
2. **Kelengkapan** - Apakah semua elemen hukum yang diperlukan sudah ada
3. **Potensi Masalah** - Identifikasi kelemahan atau masalah potensial
4. **Saran Perbaikan** - Rekomendasi spesifik untuk perbaikan
5. **Kesesuaian Hukum** - Apakah sesuai dengan peraturan yang berlaku

Format jawaban dalam HTML dengan heading dan list yang rapi.`;

    case 'correct':
      return `${basePrompt}

TUGAS: Perbaiki dokumen notaris berikut.
YANG HARUS DIPERBAIKI:
- Kesalahan ketik (typo)
- Kesalahan tata bahasa Indonesia
- Format penulisan hukum yang tidak standar
- Konsistensi istilah hukum
- Penomoran yang tidak urut
- Format tanggal, mata uang, dan angka

KEMBALIKAN dokumen yang sudah diperbaiki dalam format HTML yang sama.
JANGAN mengubah substansi dokumen, hanya perbaiki format dan bahasa.
Berikan output HTML langsung tanpa penjelasan tambahan.`;

    case 'revise':
      return `${basePrompt}

TUGAS: Revisi dokumen notaris berdasarkan instruksi yang diberikan.
ATURAN:
- Ikuti instruksi revisi dengan tepat
- Pertahankan format HTML yang ada
- Pastikan hasil revisi tetap konsisten secara hukum
- Jika instruksi tidak jelas, tetap pertahankan versi yang aman secara hukum

Kembalikan dokumen yang sudah direvisi dalam format HTML.
Berikan output HTML langsung tanpa penjelasan lain.`;

    case 'summarize':
      return `${basePrompt}

TUGAS: Buatkan ringkasan dokumen notaris yang diberikan.
ATURAN:
- Ringkasan harus mencakup poin-poin utama dokumen
- Sebutkan pihak-pihak yang terlibat
- Sebutkan objek/hal yang diperjanjikan
- Sebutkan ketentuan-ketentuan penting
- Sebutkan tanggal dan nilai penting jika ada
- Maksimal 5-8 poin utama
- Format dalam HTML dengan heading dan bullet list yang rapi
- Tulis ringkasan yang bisa dipahami orang awam`;

    case 'translate':
      return `You are a professional legal translator specializing in Indonesian notarial documents.

TASK: Translate the given Indonesian notarial document to English.
RULES:
- Maintain the exact same HTML structure and formatting
- Use proper English legal terminology
- Keep proper nouns (names, places, addresses) in their original form
- Keep Indonesian legal terms that have no direct English equivalent in brackets, e.g. [Akta Jual Beli]
- Preserve all numbering, dates, and monetary values
- Add "[Unofficial Translation]" watermark at the top
- Output HTML directly without any explanation`;

    case 'letter':
      return `${basePrompt}

TUGAS: Buatkan surat resmi notaris dalam format HTML.
ATURAN:
- Gunakan format surat resmi Indonesia (kop surat, nomor surat, perihal, lampiran)
- Bahasa Indonesia yang formal dan sopan
- Sertakan tempat untuk tanda tangan dan stempel
- Format siap cetak A4
- Gunakan placeholder [NAMA_NOTARIS], [ALAMAT_KANTOR], [NOMOR_SURAT] jika belum diketahui
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
    const systemPrompt = getSystemPrompt(req.action);
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
            result: aiContent,
            provider: settings.activeProviderId,
            model: settings.activeModelId,
            tokensUsed,
            durationMs,
            metadata: {
              documentType: req.documentType,
              title: req.title,
              letterType: req.letterType,
              targetLanguage: req.targetLanguage,
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
