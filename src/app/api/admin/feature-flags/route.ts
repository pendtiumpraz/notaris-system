import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FEATURE_FLAGS_KEY, DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/lib/feature-flags';

// GET - Fetch feature flags (accessible by all authenticated users)
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: FEATURE_FLAGS_KEY },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_FEATURE_FLAGS);
    }

    const flags: FeatureFlags = JSON.parse(setting.value);
    return NextResponse.json(flags);
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return NextResponse.json(DEFAULT_FEATURE_FLAGS);
  }
}

// PUT - Update feature flags (SUPER_ADMIN only)
export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const flags: FeatureFlags = await request.json();
    flags.updatedAt = new Date().toISOString();

    await prisma.siteSettings.upsert({
      where: { key: FEATURE_FLAGS_KEY },
      update: {
        value: JSON.stringify(flags),
        type: 'json',
        description: 'Feature flags for package management',
        updatedBy: session.user.id,
      },
      create: {
        key: FEATURE_FLAGS_KEY,
        value: JSON.stringify(flags),
        type: 'json',
        description: 'Feature flags for package management',
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update feature flags:', error);
    return NextResponse.json({ error: 'Failed to update feature flags' }, { status: 500 });
  }
}
