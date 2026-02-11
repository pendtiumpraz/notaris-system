import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { callAIForDocument, type AIDocumentAction } from '@/lib/ai-document';

/**
 * POST /api/documents/ai
 * Execute AI operations on documents (generate, analyze, correct, revise, summarize, translate, letter)
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      action,
      documentType,
      title,
      content,
      instruction,
      clientName,
      clientAddress,
      additionalContext,
      letterType,
      targetLanguage,
    } = body as {
      action: AIDocumentAction;
      documentType: string;
      title: string;
      content?: string;
      instruction?: string;
      clientName?: string;
      clientAddress?: string;
      additionalContext?: string;
      letterType?: string;
      targetLanguage?: string;
    };

    // Validate action
    if (
      !['generate', 'analyze', 'correct', 'revise', 'summarize', 'translate', 'letter'].includes(
        action
      )
    ) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!documentType || !title) {
      return NextResponse.json({ error: 'documentType and title are required' }, { status: 400 });
    }

    // Actions that require existing content
    if (['analyze', 'correct', 'revise', 'summarize', 'translate'].includes(action) && !content) {
      return NextResponse.json({ error: 'Content is required for this action' }, { status: 400 });
    }

    if (action === 'revise' && !instruction) {
      return NextResponse.json(
        { error: 'Instruction is required for revise action' },
        { status: 400 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    const documentId = body.documentId as string | undefined;

    const result = await callAIForDocument(
      {
        action,
        documentType,
        title,
        content,
        instruction,
        clientName,
        clientAddress,
        additionalContext,
        letterType,
        targetLanguage,
      },
      userId,
      documentId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Document API error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
