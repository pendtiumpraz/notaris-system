import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token dan password wajib diisi' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
    }

    // Hash the token to match stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid session/token
    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        revokedAt: null,
        deviceInfo: {
          path: ['type'],
          equals: 'password_reset',
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password and revoke the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash },
      }),
      prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: 'Password berhasil direset' });
  } catch (error) {
    console.error('Error in reset password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
