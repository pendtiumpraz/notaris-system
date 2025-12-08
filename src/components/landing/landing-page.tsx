'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scale,
  FileText,
  Calendar,
  MessageSquare,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Building2,
  Home,
  Gift,
  FileCheck,
  FileSignature,
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  X,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SiteContent {
  settings: Record<string, string>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string | null;
  }>;
  testimonials: Array<{
    id: string;
    clientName: string;
    clientTitle: string | null;
    content: string;
    rating: number;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    position: string;
    bio: string | null;
    photo: string | null;
  }>;
  services: Array<{
    id: string;
    title: string;
    description: string;
    icon: string | null;
    features: string[] | null;
  }>;
}

const iconMap: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-8 h-8" />,
  Home: <Home className="w-8 h-8" />,
  Gift: <Gift className="w-8 h-8" />,
  FileCheck: <FileCheck className="w-8 h-8" />,
  FileSignature: <FileSignature className="w-8 h-8" />,
  Scale: <Scale className="w-8 h-8" />,
};

// Unsplash images for team members (professional headshots)
const teamImages = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
];

// Unsplash images for testimonials
const testimonialImages = [
  'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
];

const defaultSettings: Record<string, string> = {
  site_name: 'Kantor Notaris',
  site_tagline: 'Melayani dengan Integritas',
  hero_title: 'Layanan Notaris & PPAT Profesional',
  hero_subtitle:
    'Kami membantu Anda mengurus segala kebutuhan dokumen legal dengan cepat, aman, dan terpercaya.',
  contact_address: 'Jl. Sudirman No. 123, Jakarta Pusat',
  contact_phone: '+62 21 1234 5678',
  contact_email: 'info@notaris.co.id',
  contact_whatsapp: '+62 812 3456 7890',
  office_hours: 'Senin - Jumat: 08:00 - 17:00',
  stats_clients: '5000+',
  stats_documents: '15000+',
  stats_experience: '20+',
  about_content:
    'Kantor Notaris kami telah melayani masyarakat dengan dedikasi tinggi selama lebih dari 20 tahun. Kami berkomitmen untuk memberikan layanan legal yang profesional, terpercaya, dan efisien untuk setiap klien.',
};

export function LandingPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/public/content');
        if (res.ok) {
          const data = await res.json();
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
      }
    };
    fetchContent();
  }, []);

  const settings = content?.settings || defaultSettings;
  const faqs = content?.faqs || [];
  const testimonials = content?.testimonials || [];
  const teamMembers = content?.teamMembers || [];
  const services = content?.services || [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-white hidden sm:block">
                {settings.site_name?.split(',')[0] || 'Kantor Notaris'}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <a href="#layanan" className="text-slate-300 hover:text-white transition-colors">
                Layanan
              </a>
              <a href="#tentang" className="text-slate-300 hover:text-white transition-colors">
                Tentang
              </a>
              <a href="#tim" className="text-slate-300 hover:text-white transition-colors">
                Tim
              </a>
              <a href="#testimoni" className="text-slate-300 hover:text-white transition-colors">
                Testimoni
              </a>
              <a href="#faq" className="text-slate-300 hover:text-white transition-colors">
                FAQ
              </a>
              <a href="#kontak" className="text-slate-300 hover:text-white transition-colors">
                Kontak
              </a>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button asChild className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700">
                <Link href="/login">Masuk Portal</Link>
              </Button>
              <button
                className="md:hidden p-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 py-4">
            <div className="flex flex-col gap-2 px-4">
              <a
                href="#layanan"
                className="py-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Layanan
              </a>
              <a
                href="#tentang"
                className="py-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Tentang
              </a>
              <a
                href="#tim"
                className="py-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Tim
              </a>
              <a
                href="#testimoni"
                className="py-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimoni
              </a>
              <a
                href="#faq"
                className="py-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </a>
              <a
                href="#kontak"
                className="py-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Kontak
              </a>
              <Button asChild className="mt-2 bg-emerald-600 hover:bg-emerald-700">
                <Link href="/login">Masuk Portal</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop"
            alt="Legal Office"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
                <Scale className="w-4 h-4" />
                <span>Notaris & PPAT Resmi</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {settings.hero_title}
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                {settings.hero_subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-base"
                >
                  <Link href="/login">
                    Masuk ke Portal
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 text-base"
                >
                  <a href="#layanan">
                    <Play className="w-5 h-5 mr-2" />
                    Lihat Layanan
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-800">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                    {settings.stats_clients}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Klien Terlayani</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                    {settings.stats_documents}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Dokumen Dibuat</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                    {settings.stats_experience}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Tahun Pengalaman</div>
                </div>
              </div>
            </div>

            {/* Hero Image Card */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&h=700&fit=crop"
                  alt="Notaris Professional"
                  width={600}
                  height={700}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Layanan Terpercaya</div>
                        <div className="text-sm text-slate-400">Bersertifikat & Berizin Resmi</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Card */}
              <div className="absolute -left-8 top-1/4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[0, 1, 2].map((i) => (
                      <Image
                        key={i}
                        src={testimonialImages[i]}
                        alt="Client"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-slate-900"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">5000+ Klien</div>
                    <div className="text-xs text-slate-400">Puas dengan layanan kami</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Platform digital modern untuk kemudahan layanan notaris Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Manajemen Dokumen"
              description="Upload, tracking, dan kelola dokumen notaris Anda secara digital dengan aman"
              image="https://images.unsplash.com/photo-1568234928966-359c35dd8327?w=400&h=300&fit=crop"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Penjadwalan Online"
              description="Buat janji temu dengan notaris kapan saja dan di mana saja dengan mudah"
              image="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Komunikasi Langsung"
              description="Chat langsung dengan tim notaris untuk konsultasi dan update status"
              image="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Keamanan Data"
              description="Data Anda aman dengan sistem keamanan berlapis dan enkripsi modern"
              image="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-medium">LAYANAN KAMI</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              Layanan Notaris & PPAT
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Berbagai layanan notaris dan PPAT untuk memenuhi kebutuhan legal Anda dengan
              profesionalisme tinggi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length > 0 ? (
              services.map((service) => (
                <div
                  key={service.id}
                  className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    {service.icon ? (
                      iconMap[service.icon] || <FileText className="w-8 h-8" />
                    ) : (
                      <FileText className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{service.description}</p>
                  {service.features && Array.isArray(service.features) && (
                    <ul className="space-y-2">
                      {(service.features as string[]).slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              // Default services if none from database
              <>
                <ServiceCard
                  icon={<Building2 />}
                  title="Akta Pendirian PT"
                  description="Pembuatan akta pendirian perusahaan, CV, dan badan usaha lainnya"
                />
                <ServiceCard
                  icon={<Home />}
                  title="Akta Jual Beli (AJB)"
                  description="Pengurusan akta jual beli properti dan tanah yang sah secara hukum"
                />
                <ServiceCard
                  icon={<FileSignature />}
                  title="Legalisasi Dokumen"
                  description="Legalisasi dan waarmerking dokumen untuk keperluan legal"
                />
                <ServiceCard
                  icon={<Gift />}
                  title="Akta Hibah & Waris"
                  description="Pembuatan akta hibah dan pembagian warisan sesuai hukum"
                />
                <ServiceCard
                  icon={<FileCheck />}
                  title="Akta Perjanjian"
                  description="Pembuatan berbagai akta perjanjian kerjasama dan kontrak"
                />
                <ServiceCard
                  icon={<Scale />}
                  title="Konsultasi Hukum"
                  description="Konsultasi terkait masalah legal dan kenotariatan"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=500&fit=crop"
                      alt="Kantor Notaris"
                      width={400}
                      height={500}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop"
                      alt="Dokumen Legal"
                      width={400}
                      height={300}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1521791055366-0d553872125f?w=400&h=300&fit=crop"
                      alt="Konsultasi"
                      width={400}
                      height={300}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=500&fit=crop"
                      alt="Meeting"
                      width={400}
                      height={500}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Experience Badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 rounded-2xl p-6 shadow-xl">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{settings.stats_experience}</div>
                  <div className="text-emerald-100 text-sm">Tahun Pengalaman</div>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <span className="text-emerald-400 font-medium">TENTANG KAMI</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-6">
                {settings.about_title || 'Kantor Notaris Terpercaya'}
              </h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                {settings.about_content || defaultSettings.about_content}
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Bersertifikat Resmi</h4>
                    <p className="text-sm text-slate-400">
                      Terdaftar di Kementerian Hukum dan HAM RI
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Tim Profesional</h4>
                    <p className="text-sm text-slate-400">
                      Didukung tim yang berpengalaman dan kompeten
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Kerahasiaan Terjamin</h4>
                    <p className="text-sm text-slate-400">
                      Data dan dokumen Anda aman bersama kami
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href="#kontak">
                  Hubungi Kami
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="tim" className="py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-medium">TIM KAMI</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">Tim Profesional</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Didukung oleh tim yang berpengalaman dan berkomitmen tinggi
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <Image
                      src={member.photo || teamImages[index % teamImages.length]}
                      alt={member.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-semibold text-white text-lg">{member.name}</h3>
                    <p className="text-emerald-400 text-sm">{member.position}</p>
                  </div>
                </div>
              ))
            ) : (
              // Default team if none from database
              <>
                <TeamCard
                  name="Budi Santoso, S.H., M.Kn."
                  position="Notaris & PPAT"
                  image={teamImages[0]}
                />
                <TeamCard
                  name="Siti Rahayu, S.H."
                  position="Senior Associate"
                  image={teamImages[1]}
                />
                <TeamCard
                  name="Ahmad Wijaya, S.H."
                  position="Legal Consultant"
                  image={teamImages[2]}
                />
                <TeamCard name="Dewi Anggraini" position="Client Relations" image={teamImages[3]} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimoni" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-medium">TESTIMONI</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
              Apa Kata Klien Kami
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Kepuasan klien adalah prioritas utama kami
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.length > 0 ? (
              testimonials.slice(0, 6).map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <Image
                      src={testimonialImages[index % testimonialImages.length]}
                      alt={testimonial.clientName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-white">{testimonial.clientName}</div>
                      {testimonial.clientTitle && (
                        <div className="text-sm text-slate-400">{testimonial.clientTitle}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Default testimonials
              <>
                <TestimonialCard
                  content="Pelayanan sangat profesional dan cepat. Dokumen saya selesai lebih cepat dari perkiraan."
                  name="Andi Pratama"
                  title="Pengusaha"
                  rating={5}
                  image={testimonialImages[0]}
                />
                <TestimonialCard
                  content="Sangat membantu dalam proses pembuatan akta perusahaan. Tim yang sangat responsif."
                  name="Maria Susanti"
                  title="Direktur PT. Maju Jaya"
                  rating={5}
                  image={testimonialImages[1]}
                />
                <TestimonialCard
                  content="Portal online sangat memudahkan untuk tracking dokumen. Recommended!"
                  name="Rudi Hermawan"
                  title="Konsultan"
                  rating={5}
                  image={testimonialImages[2]}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-medium">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">Pertanyaan Umum</h2>
            <p className="text-slate-400">Temukan jawaban atas pertanyaan yang sering diajukan</p>
          </div>
          <div className="space-y-4">
            {(faqs.length > 0 ? faqs : defaultFaqs).map((faq, index) => (
              <div
                key={faq.id || index}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenFaq(
                      openFaq === (faq.id || String(index)) ? null : faq.id || String(index)
                    )
                  }
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  {openFaq === (faq.id || String(index)) ? (
                    <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === (faq.id || String(index)) && (
                  <div className="px-5 pb-5 text-slate-300 leading-relaxed">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=600&fit=crop"
            alt="Background"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap Untuk Memulai?</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
            Daftarkan diri Anda di portal kami dan nikmati kemudahan layanan notaris digital
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white !text-emerald-700 hover:bg-slate-100 h-14 px-8 font-semibold"
            >
              <Link href="/login">
                Masuk ke Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border-2 border-white bg-transparent !text-white hover:bg-white/20 h-14 px-8 font-semibold"
            >
              <a href="#kontak">Hubungi Kami</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontak" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-medium">KONTAK</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">Hubungi Kami</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Silakan hubungi kami untuk konsultasi atau informasi lebih lanjut
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Alamat</h3>
                  <p className="text-slate-400">{settings.contact_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Telepon</h3>
                  <p className="text-slate-400">{settings.contact_phone}</p>
                  <p className="text-slate-400">WhatsApp: {settings.contact_whatsapp}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email</h3>
                  <p className="text-slate-400">{settings.contact_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Jam Operasional</h3>
                  <p className="text-slate-400">{settings.office_hours}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <a
                    href={`https://wa.me/${settings.contact_whatsapp?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                >
                  <a
                    href={settings.google_maps_link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Lihat di Maps
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 h-[500px]">
              {settings.google_maps_embed ? (
                <iframe
                  src={settings.google_maps_embed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps"
                />
              ) : (
                <div className="w-full h-full relative">
                  <Image
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop"
                    alt="Location Map"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <p className="text-white font-medium">Jakarta, Indonesia</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">{settings.site_name}</span>
              </div>
              <p className="text-slate-400 text-sm mb-4 max-w-md">{settings.site_tagline}</p>
              <div className="flex gap-3">
                {settings.social_facebook && (
                  <a
                    href={settings.social_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings.social_instagram && (
                  <a
                    href={settings.social_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings.social_linkedin && (
                  <a
                    href={settings.social_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Tautan Cepat</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#layanan" className="text-slate-400 hover:text-white transition-colors">
                    Layanan
                  </a>
                </li>
                <li>
                  <a href="#tentang" className="text-slate-400 hover:text-white transition-colors">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a href="#tim" className="text-slate-400 hover:text-white transition-colors">
                    Tim
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-slate-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Portal Klien</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Daftar
                  </Link>
                </li>
                <li>
                  <a href="#kontak" className="text-slate-400 hover:text-white transition-colors">
                    Hubungi Kami
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            {settings.footer_copyright ||
              `© ${new Date().getFullYear()} ${settings.site_name}. All rights reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component helpers
function FeatureCard({
  icon,
  title,
  description,
  image,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="relative p-6">
        <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
      <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform [&>svg]:w-8 [&>svg]:h-8">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function TeamCard({ name, position, image }: { name: string; position: string; image: string }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all">
      <div className="aspect-[3/4] overflow-hidden">
        <Image
          src={image}
          alt={name}
          width={400}
          height={500}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-semibold text-white text-lg">{name}</h3>
        <p className="text-emerald-400 text-sm">{position}</p>
      </div>
    </div>
  );
}

function TestimonialCard({
  content,
  name,
  title,
  rating,
  image,
}: {
  content: string;
  name: string;
  title: string;
  rating: number;
  image: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-all">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-slate-300 mb-6 leading-relaxed">&ldquo;{content}&rdquo;</p>
      <div className="flex items-center gap-4">
        <Image
          src={image}
          alt={name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <div className="font-medium text-white">{name}</div>
          <div className="text-sm text-slate-400">{title}</div>
        </div>
      </div>
    </div>
  );
}

// Default FAQs
const defaultFaqs = [
  {
    id: '1',
    question: 'Berapa lama proses pembuatan akta notaris?',
    answer:
      'Waktu pembuatan akta bervariasi tergantung jenis akta. Akta sederhana bisa selesai dalam 1-3 hari kerja, sedangkan akta yang memerlukan pengecekan lebih lanjut bisa memakan waktu 5-7 hari kerja.',
    category: null,
  },
  {
    id: '2',
    question: 'Dokumen apa saja yang perlu disiapkan?',
    answer:
      'Dokumen yang diperlukan berbeda untuk setiap jenis akta. Secara umum, Anda perlu menyiapkan KTP, KK, dan dokumen pendukung sesuai jenis akta yang akan dibuat. Tim kami akan memberikan daftar lengkap setelah konsultasi awal.',
    category: null,
  },
  {
    id: '3',
    question: 'Apakah bisa konsultasi online?',
    answer:
      'Ya, kami menyediakan layanan konsultasi online melalui portal klien kami. Anda bisa chat langsung dengan tim kami atau menjadwalkan video call untuk konsultasi lebih detail.',
    category: null,
  },
  {
    id: '4',
    question: 'Bagaimana cara tracking status dokumen?',
    answer:
      'Setelah mendaftar di portal klien kami, Anda bisa login dan melihat status dokumen secara real-time. Kami juga akan mengirimkan notifikasi setiap ada update status.',
    category: null,
  },
  {
    id: '5',
    question: 'Apakah melayani area di luar Jakarta?',
    answer:
      'Ya, kami melayani klien dari seluruh Indonesia. Untuk wilayah di luar Jakarta, konsultasi awal bisa dilakukan secara online, dan penandatanganan akta bisa diatur sesuai kebutuhan.',
    category: null,
  },
];
