/**
 * AI Chatbot Service with RAG Pipeline
 * Handles conversation management, knowledge retrieval, and AI interaction
 */

import { prisma } from '@/lib/prisma';
import { getProvider, type AISettings } from '@/lib/ai-providers';
import { estimateTokens, extractTokensFromResponse } from '@/lib/token-estimator';
import { Prisma } from '@prisma/client';

const AI_SETTINGS_KEY = 'ai_provider_settings';

// ======================== TYPES ========================

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId?: string;
  sessionToken: string;
  userId?: string;
  userRole?: string;
  userName?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  messageId: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  ragSources: string[];
}

interface KBChunkResult {
  id: string;
  content: string;
  kb_title: string;
  category: string;
  rank: number;
}

// ======================== SYSTEM PROMPTS PER ROLE ========================

function getSystemPromptForRole(role: string): string {
  const baseRules = `
ATURAN WAJIB:
- Jawab dalam Bahasa Indonesia yang sopan dan profesional
- Jawaban ringkas dan to-the-point, maksimal 4-5 kalimat kecuali ditanya detail
- JANGAN gunakan format markdown. Tulis plain text biasa
- Jika ada URL yang relevan, berikan dalam format: "Silakan buka halaman [nama] di /url"
- Jika pertanyaan di luar cakupan, jawab "Maaf, saya tidak bisa membantu dengan hal tersebut"
- JANGAN membuat informasi yang tidak ada di konteks
- Gunakan emoji secukupnya untuk kesan ramah`;

  switch (role) {
    case 'GUEST':
      return `Kamu adalah asisten virtual kantor notaris yang ramah dan profesional.
Tugasmu membantu calon klien mendapatkan informasi tentang layanan notaris.

Bantu mereka dengan:
- Informasi layanan notaris (jenis akta, surat, dll)
- Persyaratan dokumen
- Prosedur umum
- Estimasi biaya (jika ada di data)
- Arahkan untuk membuat akun atau appointment jika tertarik

JANGAN berikan info tentang fitur internal sistem (admin, staff dashboard, dll).
${baseRules}`;

    case 'CLIENT':
      return `Kamu adalah asisten virtual kantor notaris untuk klien yang sudah terdaftar.

Bantu klien dengan:
- Status dan tracking dokumen mereka
- Cara membuat appointment/janji
- Info tagihan & cara pembayaran
- Panduan navigasi portal klien
- Persyaratan dokumen yang dibutuhkan
- Cara menghubungi staff/admin melalui messaging

Berikan URL halaman yang relevan jika klien butuh navigasi.
${baseRules}`;

    case 'STAFF':
      return `Kamu adalah asisten kantor notaris untuk staff.

Bantu staff dengan:
- Panduan menggunakan editor dokumen (multi-page, page setup, PDF export)
- Cara menggunakan AI document tools (generate, analyze, correct, revise, translate, summarize)
- Workflow dokumen: draft → submitted → in_review → approved → completed
- Cara mengelola appointment & billing
- Panduan repertorium & klapper
- Cara berkomunikasi dengan client via messaging
- Template dokumen

Berikan URL halaman yang relevan.
${baseRules}`;

    case 'ADMIN':
      return `Kamu adalah asisten admin kantor notaris.

Bantu admin dengan SEMUA fitur staff ditambah:
- Cara mengelola user (tambah, edit, ganti role, hapus)
- Cara mengelola branches/cabang kantor
- Cara mengelola services & document types
- Cara mengatur AI provider & model (OpenAI, Gemini, DeepSeek)
- Cara membuat & mengelola template dokumen
- Cara menggunakan reports & analytics
- Cara mengatur feature flags
- Audit logs & aktivitas
- Content management (FAQ, landing page)
- Google Drive integration
- Service fees / tarif layanan

Berikan URL halaman yang relevan.
${baseRules}`;

    case 'SUPER_ADMIN':
      return `Kamu adalah asisten teknis untuk super admin kantor notaris.

Bantu dengan SEMUA fitur termasuk:
- Semua fitur admin
- License management & status
- System configuration
- Knowledge base management
- AI analytics & token usage monitoring
- Panduan deployment & maintenance

Kamu memiliki akses penuh ke semua informasi. Berikan URL halaman yang relevan.
${baseRules}`;

    default:
      return `Kamu adalah asisten virtual kantor notaris yang ramah.
Bantu pengguna dengan informasi umum tentang layanan notaris.
${baseRules}`;
  }
}

// ======================== KNOWLEDGE SEARCH (RAG) ========================

async function searchKnowledge(
  query: string,
  userRole: string,
  topK: number = 5
): Promise<KBChunkResult[]> {
  try {
    // Strategy 1: PostgreSQL full-text search with tsvector
    const chunks = await prisma.$queryRaw<KBChunkResult[]>`
      SELECT kc.id, kc.content, kb.title as kb_title, kb.category,
             ts_rank(kc.search_vector, plainto_tsquery('simple', ${query})) as rank
      FROM knowledge_chunks kc
      JOIN knowledge_bases kb ON kc.knowledge_base_id = kb.id
      WHERE kb.is_active = true
        AND kc.search_vector @@ plainto_tsquery('simple', ${query})
        AND ${userRole} = ANY(kc.allowed_roles)
      ORDER BY rank DESC
      LIMIT ${topK}
    `;

    if (chunks.length > 0) {
      return chunks;
    }

    // Strategy 2: Fallback to ILIKE keyword matching
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    if (keywords.length === 0) return [];

    const conditions = keywords.map((kw) => Prisma.sql`kc.content ILIKE ${'%' + kw + '%'}`);
    const whereClause = Prisma.join(conditions, ' OR ');

    const fallbackChunks = await prisma.$queryRaw<KBChunkResult[]>`
      SELECT kc.id, kc.content, kb.title as kb_title, kb.category,
             0.5 as rank
      FROM knowledge_chunks kc
      JOIN knowledge_bases kb ON kc.knowledge_base_id = kb.id
      WHERE kb.is_active = true
        AND ${userRole} = ANY(kc.allowed_roles)
        AND (${whereClause})
      LIMIT ${topK}
    `;

    return fallbackChunks;
  } catch (error) {
    console.error('Knowledge search error:', error);
    return [];
  }
}

/**
 * Build RAG context string from retrieved chunks
 */
function buildRAGContext(chunks: KBChunkResult[]): string {
  if (chunks.length === 0) return '';

  const contextParts = chunks.map((c, i) => `[Info ${i + 1} - ${c.kb_title}]\n${c.content}`);

  return `
KONTEKS DARI KNOWLEDGE BASE (gunakan info ini untuk menjawab):
${contextParts.join('\n\n')}
---
Jawab berdasarkan konteks di atas jika relevan. Jika pertanyaan tidak terkait konteks, jawab berdasarkan pengetahuan umummu sebagai asisten notaris.`;
}

// ======================== SESSION MANAGEMENT ========================

async function getOrCreateSession(
  sessionToken: string,
  userId?: string,
  userRole?: string,
  provider?: string,
  model?: string
) {
  // Try to find existing session
  let session = await prisma.chatSession.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        sessionToken,
        userId: userId || null,
        userRole: userRole || 'GUEST',
        provider,
        model,
        isActive: true,
      },
    });
  }

  return session;
}

// ======================== MAIN CHAT PROCESSING ========================

export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();
  const userRole = request.userRole || 'GUEST';

  // 1. Get AI settings
  const setting = await prisma.siteSettings.findUnique({
    where: { key: AI_SETTINGS_KEY },
  });

  if (!setting) {
    throw new Error('AI belum dikonfigurasi. Silakan hubungi admin.');
  }

  const settings: AISettings = JSON.parse(setting.value);
  const provider = getProvider(settings.activeProviderId);

  if (!provider || !settings.providers[settings.activeProviderId]?.apiKey) {
    throw new Error('Layanan AI sedang tidak tersedia.');
  }

  const providerConfig = settings.providers[settings.activeProviderId];
  const modelId = settings.activeModelId;

  // 2. Get or create session
  const session = await getOrCreateSession(
    request.sessionToken,
    request.userId,
    userRole,
    settings.activeProviderId,
    modelId
  );

  // 3. Search knowledge base (RAG)
  const lastUserMessage = request.messages[request.messages.length - 1]?.content || '';
  const ragChunks = await searchKnowledge(lastUserMessage, userRole);
  const ragContext = buildRAGContext(ragChunks);
  const ragSources = [...new Set(ragChunks.map((c) => c.kb_title))];
  const ragChunkIds = ragChunks.map((c) => c.id);

  // 4. Fetch dynamic context (services, FAQ from DB)
  const [services, faqs] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      select: { name: true, description: true, durationMinutes: true },
      take: 15,
    }),
    prisma.fAQ.findMany({
      where: { isActive: true },
      select: { question: true, answer: true },
      orderBy: { order: 'asc' },
      take: 15,
    }),
  ]);

  const dynamicContext = [];
  if (services.length > 0) {
    const serviceList = services
      .map((s) => `- ${s.name}: ${s.description || ''} (${s.durationMinutes} menit)`)
      .join('\n');
    dynamicContext.push(`LAYANAN TERSEDIA:\n${serviceList}`);
  }
  if (faqs.length > 0 && ['GUEST', 'CLIENT'].includes(userRole)) {
    const faqList = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    dynamicContext.push(`FAQ:\n${faqList}`);
  }

  // 5. Build system prompt
  const systemPrompt = `${getSystemPromptForRole(userRole)}
${request.userName ? `\nNama pengguna: ${request.userName}` : ''}
${dynamicContext.length > 0 ? '\n' + dynamicContext.join('\n\n') : ''}
${ragContext}`;

  // 6. Save user message to DB
  const userMsg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: lastUserMessage,
      inputTokens: estimateTokens(lastUserMessage),
      outputTokens: 0,
      totalTokens: estimateTokens(lastUserMessage),
    },
  });

  // 7. Call LLM API
  const completionUrl = `${provider.baseUrl}${provider.completionPath}`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...request.messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
  ];

  const apiResponse = await fetch(completionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [provider.authHeader]: `${provider.authPrefix}${providerConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: apiMessages,
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!apiResponse.ok) {
    const errText = await apiResponse.text().catch(() => 'Unknown error');
    console.error('LLM API error:', apiResponse.status, errText);
    throw new Error('Gagal menghubungi AI. Silakan coba lagi.');
  }

  const result = await apiResponse.json();
  const reply = result.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa menjawab saat ini.';

  // 8. Extract token usage
  const tokenUsage = extractTokensFromResponse(result);
  const estimatedInput = estimateTokens(systemPrompt + apiMessages.map((m) => m.content).join(' '));
  const estimatedOutput = estimateTokens(reply);
  const inputTokens = tokenUsage.inputTokens || estimatedInput;
  const outputTokens = tokenUsage.outputTokens || estimatedOutput;
  const totalTokens = inputTokens + outputTokens;

  const durationMs = Date.now() - startTime;

  // 9. Save assistant message to DB
  const assistantMsg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: reply,
      inputTokens,
      outputTokens,
      totalTokens,
      durationMs,
      ragChunkIds,
      metadata: {
        provider: settings.activeProviderId,
        model: modelId,
        ragSourceCount: ragChunks.length,
      },
    },
  });

  // 10. Update session totals
  const title =
    !session.title && request.messages.length <= 2 ? lastUserMessage.slice(0, 100) : undefined;

  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      totalMessages: { increment: 2 }, // user + assistant
      totalTokens: { increment: totalTokens + (userMsg.totalTokens || 0) },
      inputTokens: { increment: inputTokens + (userMsg.inputTokens || 0) },
      outputTokens: { increment: outputTokens },
      ...(title ? { title } : {}),
      updatedAt: new Date(),
    },
  });

  return {
    reply,
    sessionId: session.id,
    messageId: assistantMsg.id,
    tokens: {
      inputTokens,
      outputTokens,
      totalTokens,
    },
    ragSources,
  };
}
