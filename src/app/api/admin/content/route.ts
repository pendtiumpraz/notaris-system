import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [settingsRaw, faqs, testimonials, teamMembers, services] = await Promise.all([
      prisma.siteSettings.findMany(),
      prisma.fAQ.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.testimonial.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.teamMember.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.serviceInfo.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
      }),
    ]);

    const settings: Record<string, string> = {};
    settingsRaw.forEach((s) => {
      settings[s.key] = s.value;
    });

    return NextResponse.json({
      settings,
      faqs,
      testimonials,
      teamMembers,
      services,
    });
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
