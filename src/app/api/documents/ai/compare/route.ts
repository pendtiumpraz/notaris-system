import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider, type AISettings } from '@/lib/ai-providers';

const AI_SETTINGS_KEY = 'ai_provider_settings';

/**
 * POST /api/documents/ai/compare
 * Compare two versions of a document using AI
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { originalContent, revisedContent, documentTitle, documentType } = await request.json();

    if (!originalContent || !revisedContent) {
      return NextResponse.json(
        { error: 'Both original and revised content are required' },
        { status: 400 }
      );
    }

    // Fetch AI settings
    const setting = await prisma.siteSettings.findUnique({
      where: { key: AI_SETTINGS_KEY },
    });

    if (!setting) {
      return NextResponse.json({ error: 'AI belum dikonfigurasi' }, { status: 400 });
    }

    const settings: AISettings = JSON.parse(setting.value);
    const provider = getProvider(settings.activeProviderId);

    if (!provider || !settings.providers[settings.activeProviderId]?.apiKey) {
      return NextResponse.json({ error: 'AI tidak tersedia' }, { status: 400 });
    }

    const providerConfig = settings.providers[settings.activeProviderId];
    const completionUrl = `${provider.baseUrl}${provider.completionPath}`;

    const response = await fetch(completionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [provider.authHeader]: `${provider.authPrefix}${providerConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.activeModelId,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah asisten hukum notaris yang ahli membandingkan dokumen.
Tugasmu adalah membandingkan VERSI LAMA dan VERSI BARU dari sebuah dokumen, lalu berikan:

1. **Ringkasan Perubahan** - Daftar perubahan utama yang terjadi
2. **Pasal yang Berubah** - Pasal/bagian mana yang diubah, ditambah, atau dihapus
3. **Implikasi Hukum** - Apakah perubahan ini memiliki implikasi hukum yang perlu diperhatikan
4. **Rekomendasi** - Apakah perubahan ini aman dan sesuai standar

Format jawaban dalam HTML yang rapi dengan heading, list, dan highlight untuk perubahan penting.
Gunakan warna: hijau untuk penambahan, merah untuk penghapusan, kuning untuk perubahan.`,
          },
          {
            role: 'user',
            content: `Bandingkan kedua versi dokumen "${documentTitle || 'Dokumen'}" (${documentType || 'umum'}) berikut:

=== VERSI LAMA ===
${originalContent}

=== VERSI BARU ===
${revisedContent}

Berikan analisis perbandingan yang detail.`,
          },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API Error: ${errorText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    const comparison = result.choices?.[0]?.message?.content || '';
    const tokensUsed = result.usage?.total_tokens || null;

    // Save to database
    const userId = (session.user as { id?: string }).id;
    if (userId) {
      try {
        await prisma.aIResult.create({
          data: {
            userId,
            action: 'compare',
            result: comparison,
            provider: settings.activeProviderId,
            model: settings.activeModelId,
            tokensUsed,
            durationMs: Date.now() - Date.now(), // approximate
            metadata: { documentTitle, documentType },
          },
        });
      } catch (e) {
        console.error('Failed to save compare result:', e);
      }
    }

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error('Document comparison error:', error);
    return NextResponse.json({ error: 'Gagal membandingkan dokumen' }, { status: 500 });
  }
}
