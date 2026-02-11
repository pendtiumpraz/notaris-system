import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider, type AISettings } from '@/lib/ai-providers';

const AI_SETTINGS_KEY = 'ai_provider_settings';

/**
 * POST /api/messages/ai-draft
 * Generate AI draft reply based on conversation context
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { conversationId, recentMessages } = (await request.json()) as {
      conversationId: string;
      recentMessages: Array<{ sender: string; content: string }>;
    };

    if (!conversationId || !recentMessages?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
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

    if (!provider) {
      return NextResponse.json({ error: 'Provider tidak ditemukan' }, { status: 400 });
    }

    const providerConfig = settings.providers[settings.activeProviderId];
    if (!providerConfig?.apiKey) {
      return NextResponse.json({ error: 'API Key belum dikonfigurasi' }, { status: 400 });
    }

    // Fetch conversation context (document if linked)
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        document: {
          select: { title: true, documentType: { select: { name: true } }, status: true },
        },
      },
    });

    const documentContext = conversation?.document
      ? `\nKonteks: Percakapan ini terkait dokumen "${conversation.document.title}" (${conversation.document.documentType?.name}), status: ${conversation.document.status}.`
      : '';

    // Build chat history for context
    const chatHistory = recentMessages
      .slice(-10)
      .map((m) => `${m.sender}: ${m.content}`)
      .join('\n');

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
            content: `Kamu adalah asisten staff notaris yang profesional dan ramah. Tugasmu membantu draft balasan pesan ke klien.
Balas dalam Bahasa Indonesia yang sopan dan profesional.
Jawab sesuai konteks percakapan.
Berikan jawaban yang ringkas dan membantu.
JANGAN menggunakan format markdown. Tulis plain text biasa.${documentContext}`,
          },
          {
            role: 'user',
            content: `Berikut riwayat percakapan terakhir:\n\n${chatHistory}\n\nBuatkan draft balasan yang profesional untuk pesan terakhir klien.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
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
    const draft = result.choices?.[0]?.message?.content || '';
    const tokensUsed = result.usage?.total_tokens || null;

    // Save to database
    const userId = (session.user as { id?: string }).id;
    if (userId) {
      try {
        await prisma.aIResult.create({
          data: {
            userId,
            action: 'message_draft',
            result: draft,
            provider: settings.activeProviderId,
            model: settings.activeModelId,
            tokensUsed,
            metadata: { conversationId },
          },
        });
      } catch (e) {
        console.error('Failed to save draft result:', e);
      }
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('AI draft error:', error);
    return NextResponse.json({ error: 'Gagal generate draft' }, { status: 500 });
  }
}
