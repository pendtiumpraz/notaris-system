import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  estimateCostUSD,
  estimateCostIDR,
  formatCostUSD,
  formatCostIDR,
} from '@/lib/token-estimator';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Aggregate totals
    const totals = await prisma.chatSession.aggregate({
      _sum: {
        totalMessages: true,
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
    });

    // Recent period totals
    const periodTotals = await prisma.chatSession.aggregate({
      where: { createdAt: { gte: sinceDate } },
      _sum: {
        totalMessages: true,
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
    });

    // By role breakdown
    const byRole = await prisma.chatSession.groupBy({
      by: ['userRole'],
      _sum: {
        totalMessages: true,
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
    });

    // Daily usage for chart (last N days)
    const dailyUsage = await prisma.$queryRaw<
      Array<{
        day: string;
        sessions: bigint;
        messages: bigint;
        tokens: bigint;
      }>
    >`
      SELECT 
        DATE(created_at) as day,
        COUNT(*) as sessions,
        SUM(total_messages) as messages,
        SUM(total_tokens) as tokens
      FROM chat_sessions
      WHERE created_at >= ${sinceDate}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `;

    // Recent sessions
    const recentSessions = await prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        userRole: true,
        totalMessages: true,
        totalTokens: true,
        provider: true,
        model: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    // Estimate cost (use default model for estimation)
    const model = recentSessions[0]?.model || 'gemini-2.5-flash';
    const totalInput = totals._sum.inputTokens || 0;
    const totalOutput = totals._sum.outputTokens || 0;
    const costUSD = estimateCostUSD(totalInput, totalOutput, model);
    const costIDR = estimateCostIDR(totalInput, totalOutput, model);

    const periodInput = periodTotals._sum.inputTokens || 0;
    const periodOutput = periodTotals._sum.outputTokens || 0;
    const periodCostUSD = estimateCostUSD(periodInput, periodOutput, model);

    return NextResponse.json({
      totals: {
        sessions: totals._count,
        messages: totals._sum.totalMessages || 0,
        totalTokens: totals._sum.totalTokens || 0,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        costUSD: formatCostUSD(costUSD),
        costIDR: formatCostIDR(costIDR),
        rawCostUSD: costUSD,
      },
      period: {
        days,
        sessions: periodTotals._count,
        messages: periodTotals._sum.totalMessages || 0,
        totalTokens: periodTotals._sum.totalTokens || 0,
        costUSD: formatCostUSD(periodCostUSD),
      },
      byRole: byRole.map((r) => ({
        role: r.userRole || 'GUEST',
        sessions: r._count,
        messages: r._sum.totalMessages || 0,
        tokens: r._sum.totalTokens || 0,
      })),
      dailyUsage: dailyUsage.map((d) => ({
        day: d.day,
        sessions: Number(d.sessions),
        messages: Number(d.messages),
        tokens: Number(d.tokens),
      })),
      recentSessions,
      model,
    });
  } catch (error) {
    console.error('AI analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
