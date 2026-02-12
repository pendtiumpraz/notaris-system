import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chunkContent } from '@/lib/knowledge-chunker';

// Seed data (same as prisma/seed-knowledge.ts but callable via API)
const SEED_ITEMS = [
  {
    title: 'FAQ Layanan Umum Notaris',
    category: 'faq',
    content:
      'FAQ dasar akan diisi dari seed script. Gunakan "npx tsx prisma/seed-knowledge.ts" untuk full seed.',
    allowedRoles: ['GUEST', 'CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
  },
];

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admin can seed knowledge base' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    let created = 0;
    let updated = 0;

    for (const item of SEED_ITEMS) {
      const existing = await prisma.knowledgeBase.findFirst({
        where: { title: item.title },
      });

      let kbId: string;

      if (existing) {
        await prisma.knowledgeBase.update({
          where: { id: existing.id },
          data: {
            content: item.content,
            category: item.category,
            allowedRoles: item.allowedRoles,
          },
        });
        kbId = existing.id;
        await prisma.knowledgeChunk.deleteMany({ where: { knowledgeBaseId: kbId } });
        updated++;
      } else {
        const created_item = await prisma.knowledgeBase.create({
          data: {
            title: item.title,
            content: item.content,
            category: item.category,
            allowedRoles: item.allowedRoles,
            sourceType: 'manual',
            createdById: userId,
          },
        });
        kbId = created_item.id;
        created++;
      }

      const chunks = chunkContent(item.content);
      for (let i = 0; i < chunks.length; i++) {
        await prisma.knowledgeChunk.create({
          data: {
            knowledgeBaseId: kbId,
            chunkIndex: i,
            content: chunks[i].content,
            allowedRoles: item.allowedRoles,
            metadata: { title: item.title, category: item.category },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${created} new, updated ${updated} existing items. For full seed, run: npx tsx prisma/seed-knowledge.ts`,
      created,
      updated,
    });
  } catch (error) {
    console.error('Knowledge base seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
