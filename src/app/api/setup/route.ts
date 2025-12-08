import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const adminExists = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        deletedAt: null,
      },
    });

    if (adminExists) {
      return NextResponse.json(
        { error: 'Setup sudah selesai. Super Admin sudah ada.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'SUPER_ADMIN',
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SETUP',
        resourceType: 'USER',
        resourceId: user.id,
        newValues: {
          name,
          email,
          role: 'SUPER_ADMIN',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Super Admin berhasil dibuat',
    });
  } catch (error) {
    console.error('Setup failed:', error);
    return NextResponse.json({ error: 'Setup gagal. Silakan coba lagi.' }, { status: 500 });
  }
}
