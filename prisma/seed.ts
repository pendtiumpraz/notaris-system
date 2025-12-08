import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use Accelerate URL for seeding
const accelerateUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  ...(accelerateUrl?.startsWith('prisma+') ? { accelerateUrl } : {}),
});

async function main() {
  console.log('Seeding database...');

  // Default Users
  const defaultPassword = await bcrypt.hash('password123', 12);

  const users = [
    {
      email: 'superadmin@notaris.com',
      name: 'Super Admin',
      passwordHash: defaultPassword,
      role: 'SUPER_ADMIN' as const,
      emailVerifiedAt: new Date(),
    },
    {
      email: 'admin@notaris.com',
      name: 'Admin Notaris',
      passwordHash: defaultPassword,
      role: 'ADMIN' as const,
      emailVerifiedAt: new Date(),
    },
    {
      email: 'staff@notaris.com',
      name: 'Staff Notaris',
      passwordHash: defaultPassword,
      role: 'STAFF' as const,
      emailVerifiedAt: new Date(),
    },
    {
      email: 'client@notaris.com',
      name: 'Client Demo',
      passwordHash: defaultPassword,
      role: 'CLIENT' as const,
      emailVerifiedAt: new Date(),
    },
  ];

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existingUser) {
      const createdUser = await prisma.user.create({ data: user });

      // Create Staff profile for STAFF role
      if (user.role === 'STAFF') {
        await prisma.staff.create({
          data: {
            userId: createdUser.id,
            employeeId: 'EMP001',
            position: 'Staff Notaris',
          },
        });
      }

      // Create Client profile for CLIENT role
      if (user.role === 'CLIENT') {
        await prisma.client.create({
          data: {
            userId: createdUser.id,
            clientNumber: 'CLT001',
            address: 'Jakarta, Indonesia',
          },
        });
      }
    }
  }
  console.log('Users seeded');

  // Site Settings
  const siteSettings = [
    {
      key: 'site_name',
      value: 'Notaris Budi Santoso, S.H., M.Kn.',
      type: 'text',
      description: 'Nama kantor notaris',
    },
    {
      key: 'site_tagline',
      value: 'Melayani dengan Integritas, Profesional, dan Terpercaya',
      type: 'text',
      description: 'Tagline website',
    },
    {
      key: 'site_description',
      value:
        'Kantor Notaris dan PPAT yang melayani berbagai kebutuhan akta dan dokumen legal dengan pengalaman lebih dari 20 tahun.',
      type: 'text',
      description: 'Deskripsi website',
    },
    {
      key: 'contact_address',
      value: 'Jl. Sudirman No. 123, Lantai 5, Jakarta Pusat 10220',
      type: 'text',
      description: 'Alamat kantor',
    },
    { key: 'contact_phone', value: '+62 21 1234 5678', type: 'text', description: 'Nomor telepon' },
    {
      key: 'contact_whatsapp',
      value: '+62 812 3456 7890',
      type: 'text',
      description: 'Nomor WhatsApp',
    },
    {
      key: 'contact_email',
      value: 'info@notarisbudi.co.id',
      type: 'text',
      description: 'Email kantor',
    },
    {
      key: 'office_hours',
      value: 'Senin - Jumat: 08:00 - 17:00, Sabtu: 08:00 - 12:00',
      type: 'text',
      description: 'Jam operasional',
    },
    {
      key: 'google_maps_embed',
      value:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6664890999!2d106.82305!3d-6.175110!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTAnMzAuNCJTIDEwNsKwNDknMjMuMCJF!5e0!3m2!1sen!2sid!4v1234567890',
      type: 'text',
      description: 'Google Maps embed URL',
    },
    {
      key: 'google_maps_link',
      value: 'https://maps.google.com/?q=-6.175110,106.82305',
      type: 'text',
      description: 'Google Maps link',
    },
    {
      key: 'social_facebook',
      value: 'https://facebook.com/notarisbudi',
      type: 'text',
      description: 'Facebook URL',
    },
    {
      key: 'social_instagram',
      value: 'https://instagram.com/notarisbudi',
      type: 'text',
      description: 'Instagram URL',
    },
    {
      key: 'social_linkedin',
      value: 'https://linkedin.com/company/notarisbudi',
      type: 'text',
      description: 'LinkedIn URL',
    },
    {
      key: 'hero_title',
      value: 'Layanan Notaris & PPAT Profesional',
      type: 'text',
      description: 'Judul hero section',
    },
    {
      key: 'hero_subtitle',
      value:
        'Kami membantu Anda mengurus segala kebutuhan dokumen legal dengan cepat, aman, dan terpercaya. Pengalaman lebih dari 20 tahun melayani ribuan klien.',
      type: 'text',
      description: 'Subtitle hero section',
    },
    { key: 'about_title', value: 'Tentang Kami', type: 'text', description: 'Judul about section' },
    {
      key: 'about_content',
      value:
        'Kantor Notaris Budi Santoso, S.H., M.Kn. didirikan pada tahun 2003 dengan komitmen memberikan pelayanan hukum terbaik. Dengan pengalaman lebih dari 20 tahun, kami telah melayani ribuan klien dari berbagai kalangan, mulai dari individu hingga perusahaan multinasional.\n\nKami percaya bahwa setiap dokumen legal harus dibuat dengan teliti, akurat, dan sesuai dengan peraturan perundang-undangan yang berlaku. Tim kami yang berpengalaman siap membantu Anda dalam setiap proses pembuatan akta dan dokumen legal lainnya.',
      type: 'text',
      description: 'Konten about section',
    },
    { key: 'stats_clients', value: '5000+', type: 'text', description: 'Jumlah klien' },
    { key: 'stats_documents', value: '15000+', type: 'text', description: 'Jumlah dokumen' },
    { key: 'stats_experience', value: '20+', type: 'text', description: 'Tahun pengalaman' },
    {
      key: 'footer_copyright',
      value: '© 2024 Kantor Notaris Budi Santoso, S.H., M.Kn. All rights reserved.',
      type: 'text',
      description: 'Copyright footer',
    },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type, description: setting.description },
      create: setting,
    });
  }
  console.log('Site settings seeded');

  // FAQs - Delete existing and create fresh
  await prisma.fAQ.deleteMany({});
  const faqs = [
    {
      question: 'Apa saja layanan yang tersedia?',
      answer:
        'Kami menyediakan berbagai layanan notaris dan PPAT termasuk pembuatan akta pendirian perusahaan, akta jual beli, akta hibah, surat kuasa, legalisasi, dan berbagai dokumen legal lainnya.',
      category: 'Umum',
      order: 1,
    },
    {
      question: 'Berapa lama proses pembuatan akta?',
      answer:
        'Waktu pengerjaan bervariasi tergantung jenis akta. Untuk akta sederhana seperti surat kuasa atau legalisasi bisa selesai dalam 1-3 hari kerja. Untuk akta yang lebih kompleks seperti pendirian PT bisa memakan waktu 7-14 hari kerja.',
      category: 'Proses',
      order: 2,
    },
    {
      question: 'Dokumen apa saja yang perlu disiapkan?',
      answer:
        'Dokumen yang diperlukan berbeda-beda tergantung jenis layanan. Umumnya Anda perlu menyiapkan KTP, KK, dan dokumen pendukung lainnya. Tim kami akan memberikan daftar lengkap dokumen yang diperlukan setelah konsultasi awal.',
      category: 'Dokumen',
      order: 3,
    },
    {
      question: 'Apakah bisa konsultasi dulu sebelum membuat akta?',
      answer:
        'Tentu saja! Kami menyediakan layanan konsultasi gratis untuk membantu Anda memahami proses dan persyaratan yang diperlukan. Anda bisa membuat janji temu melalui portal klien atau menghubungi kami langsung.',
      category: 'Umum',
      order: 4,
    },
    {
      question: 'Bagaimana cara pembayaran?',
      answer:
        'Kami menerima pembayaran melalui transfer bank dan tunai. Untuk beberapa layanan, pembayaran dapat dilakukan secara bertahap sesuai progress pengerjaan.',
      category: 'Pembayaran',
      order: 5,
    },
    {
      question: 'Apakah dokumen bisa dikirim ke alamat saya?',
      answer:
        'Ya, kami menyediakan layanan pengiriman dokumen ke alamat Anda dengan biaya tambahan. Dokumen akan dikirim menggunakan jasa kurir terpercaya dengan asuransi.',
      category: 'Pengiriman',
      order: 6,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq });
  }
  console.log('FAQs seeded');

  // Testimonials - Delete existing and create fresh
  await prisma.testimonial.deleteMany({});
  const testimonials = [
    {
      clientName: 'Andi Wijaya',
      clientTitle: 'Direktur PT Maju Bersama',
      content:
        'Pelayanan sangat profesional dan cepat. Proses pendirian PT kami selesai lebih cepat dari perkiraan. Sangat merekomendasikan!',
      rating: 5,
      isFeatured: true,
      order: 1,
    },
    {
      clientName: 'Siti Rahayu',
      clientTitle: 'Pengusaha',
      content:
        'Sudah beberapa kali menggunakan jasa Notaris Budi untuk berbagai keperluan akta. Selalu puas dengan hasilnya. Timnya sangat helpful dan komunikatif.',
      rating: 5,
      isFeatured: true,
      order: 2,
    },
    {
      clientName: 'Robert Tanaka',
      clientTitle: 'Legal Manager, PT Global Corp',
      content:
        'Kami sudah bermitra dengan kantor notaris ini selama 5 tahun. Kualitas layanan konsisten dan selalu mengikuti perkembangan regulasi terbaru.',
      rating: 5,
      isFeatured: true,
      order: 3,
    },
    {
      clientName: 'Maria Santoso',
      clientTitle: 'Ibu Rumah Tangga',
      content:
        'Proses balik nama sertifikat tanah berjalan lancar. Penjelasan dari tim sangat jelas dan membantu saya yang awam soal hukum.',
      rating: 5,
      order: 4,
    },
    {
      clientName: 'Budi Hartono',
      clientTitle: 'Komisaris PT Sentosa',
      content:
        'Pengalaman yang sangat baik dalam pembuatan akta RUPS. Tim legal yang kompeten dan detail dalam setiap dokumen.',
      rating: 5,
      order: 5,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({ data: testimonial });
  }
  console.log('Testimonials seeded');

  // Team Members - Delete existing and create fresh
  await prisma.teamMember.deleteMany({});
  const teamMembers = [
    {
      name: 'Budi Santoso, S.H., M.Kn.',
      position: 'Notaris & PPAT',
      bio: 'Notaris dan PPAT dengan pengalaman lebih dari 20 tahun. Lulusan Fakultas Hukum Universitas Indonesia dengan spesialisasi di bidang hukum bisnis dan properti.',
      order: 1,
    },
    {
      name: 'Diana Putri, S.H.',
      position: 'Associate Notary',
      bio: 'Bergabung sejak 2015, Diana memiliki keahlian khusus dalam pembuatan akta perusahaan dan kontrak bisnis internasional.',
      order: 2,
    },
    {
      name: 'Ahmad Rizki, S.H.',
      position: 'Legal Consultant',
      bio: 'Konsultan hukum dengan fokus pada hukum properti dan pertanahan. Berpengalaman menangani berbagai kasus kompleks.',
      order: 3,
    },
    {
      name: 'Sarah Amelia',
      position: 'Client Relations Manager',
      bio: 'Memastikan setiap klien mendapatkan pelayanan terbaik. Sarah siap membantu menjawab pertanyaan dan mengkoordinasikan kebutuhan Anda.',
      order: 4,
    },
  ];

  for (const member of teamMembers) {
    await prisma.teamMember.create({ data: member });
  }
  console.log('Team members seeded');

  // Service Infos - Delete existing and create fresh
  await prisma.serviceInfo.deleteMany({});
  const serviceInfos = [
    {
      title: 'Akta Pendirian Perusahaan',
      description:
        'Pembuatan akta pendirian PT, CV, Firma, dan badan usaha lainnya. Termasuk pengurusan SK Kemenkumham dan NIB.',
      icon: 'Building2',
      features: [
        'Akta Pendirian PT',
        'Akta Pendirian CV',
        'Perubahan Anggaran Dasar',
        'SK Kemenkumham',
      ],
      order: 1,
    },
    {
      title: 'Akta Jual Beli & Properti',
      description:
        'Pembuatan akta jual beli tanah, rumah, dan properti lainnya. Termasuk balik nama sertifikat dan pengecekan legalitas.',
      icon: 'Home',
      features: [
        'AJB Tanah & Bangunan',
        'Balik Nama Sertifikat',
        'Pengecekan Sertifikat',
        'SKMHT & APHT',
      ],
      order: 2,
    },
    {
      title: 'Akta Hibah & Waris',
      description:
        'Pembuatan akta hibah, wasiat, dan pengurusan pembagian waris sesuai hukum yang berlaku.',
      icon: 'Gift',
      features: ['Akta Hibah', 'Akta Wasiat', 'Surat Keterangan Waris', 'Pembagian Waris'],
      order: 3,
    },
    {
      title: 'Legalisasi & Waarmerking',
      description:
        'Legalisasi tanda tangan, waarmerking dokumen, dan pengesahan dokumen untuk berbagai keperluan.',
      icon: 'FileCheck',
      features: ['Legalisasi Dokumen', 'Waarmerking', 'Apostille', 'Fidusia'],
      order: 4,
    },
    {
      title: 'Surat Kuasa',
      description:
        'Pembuatan berbagai jenis surat kuasa untuk keperluan hukum, bisnis, dan personal.',
      icon: 'FileSignature',
      features: ['Surat Kuasa Umum', 'Surat Kuasa Khusus', 'Kuasa Menjual', 'Kuasa Mengurus'],
      order: 5,
    },
    {
      title: 'Konsultasi Hukum',
      description: 'Layanan konsultasi hukum untuk berbagai permasalahan legal yang Anda hadapi.',
      icon: 'Scale',
      features: ['Konsultasi Gratis', 'Review Dokumen', 'Pendampingan Hukum', 'Legal Opinion'],
      order: 6,
    },
  ];

  for (const service of serviceInfos) {
    await prisma.serviceInfo.create({ data: service });
  }
  console.log('Service infos seeded');

  // Document Types - Delete existing and create fresh
  await prisma.documentType.deleteMany({});
  const documentTypes = [
    {
      name: 'Akta Pendirian PT',
      description: 'Akta pendirian Perseroan Terbatas',
      estimatedDurationDays: 14,
    },
    {
      name: 'Akta Jual Beli',
      description: 'Akta jual beli properti/tanah',
      estimatedDurationDays: 7,
    },
    { name: 'Akta Hibah', description: 'Akta hibah/pemberian', estimatedDurationDays: 7 },
    { name: 'Surat Kuasa', description: 'Surat kuasa umum/khusus', estimatedDurationDays: 3 },
    { name: 'Legalisasi', description: 'Legalisasi dokumen', estimatedDurationDays: 1 },
    { name: 'Waarmerking', description: 'Waarmerking dokumen', estimatedDurationDays: 1 },
    { name: 'Akta RUPS', description: 'Akta Rapat Umum Pemegang Saham', estimatedDurationDays: 7 },
    {
      name: 'Akta Perubahan PT',
      description: 'Akta perubahan anggaran dasar PT',
      estimatedDurationDays: 10,
    },
  ];

  for (const docType of documentTypes) {
    await prisma.documentType.create({ data: docType });
  }
  console.log('Document types seeded');

  // Services - Delete existing and create fresh
  await prisma.service.deleteMany({});
  const services = [
    { name: 'Konsultasi Umum', description: 'Konsultasi umum dengan notaris', durationMinutes: 30 },
    {
      name: 'Penandatanganan Akta',
      description: 'Penandatanganan akta notariil',
      durationMinutes: 60,
    },
    { name: 'Review Dokumen', description: 'Review dan pengecekan dokumen', durationMinutes: 45 },
    {
      name: 'Pengambilan Dokumen',
      description: 'Pengambilan dokumen yang sudah selesai',
      durationMinutes: 15,
    },
    {
      name: 'Konsultasi Khusus',
      description: 'Konsultasi mendalam untuk kasus kompleks',
      durationMinutes: 60,
    },
  ];

  for (const service of services) {
    await prisma.service.create({ data: service });
  }
  console.log('Services seeded');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
