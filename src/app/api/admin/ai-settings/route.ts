import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_AI_SETTINGS, type AISettings } from '@/lib/ai-providers';

const AI_SETTINGS_KEY = 'ai_provider_settings';

/**
 * GET /api/admin/ai-settings
 * Fetch current AI provider settings
 */
export async function GET() {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: AI_SETTINGS_KEY },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_AI_SETTINGS);
    }

    const parsed: AISettings = JSON.parse(setting.value);
    // Mask API keys for security — only show last 4 chars
    const masked = {
      ...parsed,
      providers: Object.fromEntries(
        Object.entries(parsed.providers || {}).map(([key, val]) => [
          key,
          {
            ...val,
            apiKey: val.apiKey
              ? `${'•'.repeat(Math.max(0, val.apiKey.length - 4))}${val.apiKey.slice(-4)}`
              : '',
          },
        ])
      ),
    };

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Failed to fetch AI settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/ai-settings
 * Update AI provider settings
 */
export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { activeProviderId, activeModelId, providerUpdates } = data as {
      activeProviderId?: string;
      activeModelId?: string;
      providerUpdates?: Record<string, { apiKey?: string }>;
    };

    // Fetch existing settings
    const existing = await prisma.siteSettings.findUnique({
      where: { key: AI_SETTINGS_KEY },
    });

    const current: AISettings = existing ? JSON.parse(existing.value) : DEFAULT_AI_SETTINGS;

    // Update active provider/model
    if (activeProviderId) current.activeProviderId = activeProviderId;
    if (activeModelId) current.activeModelId = activeModelId;

    // Update provider API keys
    if (providerUpdates) {
      for (const [providerId, update] of Object.entries(providerUpdates)) {
        if (!current.providers[providerId]) {
          current.providers[providerId] = { apiKey: '', isConfigured: false };
        }
        if (update.apiKey !== undefined) {
          // Only update if not masked (contains actual key, not dots)
          if (!update.apiKey.includes('•')) {
            current.providers[providerId].apiKey = update.apiKey;
            current.providers[providerId].isConfigured = update.apiKey.length > 0;
          }
        }
      }
    }

    // Upsert the settings
    await prisma.siteSettings.upsert({
      where: { key: AI_SETTINGS_KEY },
      create: {
        key: AI_SETTINGS_KEY,
        value: JSON.stringify(current),
        type: 'json',
        description: 'AI Provider Settings (API keys, active model, etc.)',
        updatedBy: session.user.id,
      },
      update: {
        value: JSON.stringify(current),
        updatedBy: session.user.id,
      },
    });

    // Return masked version
    const masked: AISettings = {
      ...current,
      providers: Object.fromEntries(
        Object.entries(current.providers).map(([key, val]) => [
          key,
          {
            ...val,
            apiKey: val.apiKey
              ? `${'•'.repeat(Math.max(0, val.apiKey.length - 4))}${val.apiKey.slice(-4)}`
              : '',
          },
        ])
      ),
    };

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Failed to update AI settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ai-settings/test
 * Test AI provider connection
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { providerId, modelId } = await request.json();

    // Fetch actual API key from settings
    const setting = await prisma.siteSettings.findUnique({
      where: { key: AI_SETTINGS_KEY },
    });

    if (!setting) {
      return NextResponse.json({ error: 'AI settings not configured' }, { status: 400 });
    }

    const settings: AISettings = JSON.parse(setting.value);
    const providerConfig = settings.providers[providerId];

    if (!providerConfig?.apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for this provider' },
        { status: 400 }
      );
    }

    // Import provider details
    const { getProvider } = await import('@/lib/ai-providers');
    const provider = getProvider(providerId);

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 400 });
    }

    const completionUrl = `${provider.baseUrl}${provider.completionPath}`;

    // Make a test completion call
    const testResponse = await fetch(completionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [provider.authHeader]: `${provider.authPrefix}${providerConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Say "hello" in one word.' }],
        max_tokens: 10,
      }),
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.text();
      return NextResponse.json({
        success: false,
        error: `API Error (${testResponse.status}): ${errorData.substring(0, 200)}`,
      });
    }

    const result = await testResponse.json();
    const reply = result.choices?.[0]?.message?.content || 'No response';

    return NextResponse.json({
      success: true,
      message: `Koneksi berhasil! Response: "${reply}"`,
      model: modelId,
    });
  } catch (error) {
    console.error('AI test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
