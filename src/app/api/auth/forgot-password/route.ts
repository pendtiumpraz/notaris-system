import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    // Find user by email (don't reveal if user exists or not)
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (user) {
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in sessions table (reusing as password reset tokens)
      await prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          deviceInfo: { type: 'password_reset' },
        },
      });

      // Send reset email
      await sendPasswordResetEmail(email, token);
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json({
      message: 'Jika email terdaftar, link reset password telah dikirim',
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
