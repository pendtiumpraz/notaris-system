import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.notificationSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId: session.user.id,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emailEnabled, smsEnabled, pushEnabled, quietHoursStart, quietHoursEnd } = body;

    const settings = await prisma.notificationSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(smsEnabled !== undefined && { smsEnabled }),
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(quietHoursStart !== undefined && { quietHoursStart }),
        ...(quietHoursEnd !== undefined && { quietHoursEnd }),
      },
      create: {
        userId: session.user.id,
        emailEnabled: emailEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        pushEnabled: pushEnabled ?? true,
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
