import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProvider, type AISettings } from '@/lib/ai-providers';

const AI_SETTINGS_KEY = 'ai_provider_settings';

/**
 * POST /api/chatbot
 * Public AI chatbot for client-facing landing page
 * No authentication required — public endpoint
 */
export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Fetch AI settings
    const setting = await prisma.siteSettings.findUnique({
      where: { key: AI_SETTINGS_KEY },
    });

    if (!setting) {
      return NextResponse.json({
        reply:
          'Maaf, layanan AI belum dikonfigurasi. Silakan hubungi kami langsung melalui WhatsApp atau telepon.',
      });
    }

    const settings: AISettings = JSON.parse(setting.value);
    const provider = getProvider(settings.activeProviderId);

    if (!provider || !settings.providers[settings.activeProviderId]?.apiKey) {
      return NextResponse.json({
        reply: 'Maaf, layanan AI sedang tidak tersedia. Silakan hubungi kami langsung.',
      });
    }

    const providerConfig = settings.providers[settings.activeProviderId];

    // Fetch services/FAQ for context
    const [services, faqs] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        select: { name: true, description: true, durationMinutes: true },
        take: 20,
      }),
      prisma.fAQ.findMany({
        where: { isActive: true },
        select: { question: true, answer: true },
        orderBy: { order: 'asc' },
        take: 20,
      }),
    ]);

    const serviceList = services
      .map((s) => `- ${s.name}: ${s.description || ''} (estimasi ${s.durationMinutes} menit)`)
      .join('\n');

    const faqList = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

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
            content: `Kamu adalah asisten virtual kantor notaris yang ramah dan profesional.
Tugasmu membantu calon klien mendapatkan informasi tentang layanan notaris.

LAYANAN YANG TERSEDIA:
${serviceList || 'Belum ada data layanan.'}

FAQ:
${faqList || 'Belum ada FAQ.'}

ATURAN:
- Jawab dalam Bahasa Indonesia yang sopan dan profesional
- Berikan informasi yang akurat berdasarkan data layanan & FAQ di atas
- Jika pertanyaan di luar cakupan, arahkan untuk menghubungi kantor langsung
- Jawaban ringkas, maksimal 3-4 kalimat
- JANGAN membuat informasi harga atau biaya yang tidak ada di data
- Sarankan klien untuk membuat janji (appointment) jika mereka serius
- JANGAN gunakan format markdown. Tulis plain text biasa`,
          },
          ...messages.slice(-10),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        reply: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami langsung.',
      });
    }

    const result = await response.json();
    const reply =
      result.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa menjawab saat ini.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({
      reply: 'Maaf, terjadi kesalahan teknis. Silakan hubungi kami langsung.',
    });
  }
}
