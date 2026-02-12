import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processChat } from '@/lib/ai-chatbot';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, sessionId, sessionToken } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token is required' }, { status: 400 });
    }

    // Get user session (optional - works for guests too)
    let userId: string | undefined;
    let userRole = 'GUEST';
    let userName: string | undefined;

    try {
      const session = await auth();
      if (session?.user) {
        userId = session.user.id;
        userRole = session.user.role || 'CLIENT';
        userName = session.user.name || undefined;
      }
    } catch {
      // Guest user - continue without auth
    }

    const result = await processChat({
      messages,
      sessionId,
      sessionToken,
      userId,
      userRole,
      userName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chatbot API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
