import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [settings, faqs, testimonials, teamMembers, services] = await Promise.all([
      prisma.siteSettings.findMany(),
      prisma.fAQ.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.testimonial.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.teamMember.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      }),
      prisma.serviceInfo.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      settings: settingsMap,
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
