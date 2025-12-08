'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import Image from 'next/image';
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

const defaultSettings: Record<string, string> = {
  site_name: 'Kantor Notaris',
  site_tagline: 'Melayani dengan Integritas',
  hero_title: 'Layanan Notaris & PPAT Profesional',
  hero_subtitle: 'Kami membantu Anda mengurus segala kebutuhan dokumen legal.',
  contact_address: 'Jakarta, Indonesia',
  contact_phone: '+62 21 1234 5678',
  contact_email: 'info@notaris.co.id',
  contact_whatsapp: '+62 812 3456 7890',
  office_hours: 'Senin - Jumat: 08:00 - 17:00',
  stats_clients: '5000+',
  stats_documents: '15000+',
  stats_experience: '20+',
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
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-white hidden sm:block">
                {settings.site_name?.split(',')[0] || 'Kantor Notaris'}
              </span>
            </Link>

            {/* Desktop Nav */}
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

            {/* Right Actions */}
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

        {/* Mobile Menu */}
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
      <section className="gradient-bg pt-32 pb-20 px-4">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center">
            <div className="logo-animate inline-block mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto">
                <Scale className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-up">
              {settings.hero_title}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8 animate-fade-up delay-100">
              {settings.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-200">
              <Button
                asChild
                size="lg"
                className="btn-shine bg-emerald-600 hover:bg-emerald-700 h-12 px-8"
              >
                <Link href="/login">
                  Masuk ke Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-8 border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700"
              >
                <a href="#kontak">Hubungi Kami</a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mt-16">
            <div className="text-center animate-fade-up delay-200">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                {settings.stats_clients}
              </div>
              <div className="text-sm md:text-base text-slate-400 mt-1">Klien Terlayani</div>
            </div>
            <div className="text-center animate-fade-up delay-300">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                {settings.stats_documents}
              </div>
              <div className="text-sm md:text-base text-slate-400 mt-1">Dokumen Dibuat</div>
            </div>
            <div className="text-center animate-fade-up delay-400">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                {settings.stats_experience}
              </div>
              <div className="text-sm md:text-base text-slate-400 mt-1">Tahun Pengalaman</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Manajemen Dokumen"
              description="Upload, tracking, dan kelola dokumen notaris Anda secara digital"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Penjadwalan Online"
              description="Buat janji temu dengan notaris kapan saja dan di mana saja"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Komunikasi Langsung"
              description="Chat langsung dengan tim notaris untuk konsultasi cepat"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Keamanan Data"
              description="Data Anda aman dengan sistem keamanan berlapis"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Layanan Kami</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Berbagai layanan notaris dan PPAT untuk memenuhi kebutuhan legal Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group"
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
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {settings.about_title || 'Tentang Kami'}
              </h2>
              <div className="space-y-4 text-slate-300">
                {(settings.about_content || '').split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Terpercaya</div>
                    <div className="text-sm text-slate-400">Sejak 2003</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Tim Profesional</div>
                    <div className="text-sm text-slate-400">Berpengalaman</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-slate-800 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <Scale className="w-24 h-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="tim" className="py-20 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tim Kami</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Tim profesional yang siap membantu kebutuhan legal Anda
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center group hover:border-emerald-500/50 transition-all"
              >
                <div className="w-24 h-24 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-10 h-10 text-slate-500" />
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-sm text-emerald-400 mb-3">{member.position}</p>
                {member.bio && <p className="text-sm text-slate-400 line-clamp-3">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimoni" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Apa Kata Klien Kami</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Kepuasan klien adalah prioritas utama kami
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 6).map((testimonial) => (
              <div
                key={testimonial.id}
                className="p-6 rounded-xl bg-slate-950 border border-slate-800"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400 font-semibold">
                      {testimonial.clientName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.clientName}</div>
                    {testimonial.clientTitle && (
                      <div className="text-sm text-slate-400">{testimonial.clientTitle}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-slate-400">Temukan jawaban atas pertanyaan umum di sini</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {openFaq === faq.id && <div className="px-4 pb-4 text-slate-300">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Map Section */}
      <section id="kontak" className="py-20 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Hubungi Kami</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Silakan hubungi kami untuk konsultasi atau informasi lebih lanjut
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Alamat</h3>
                  <p className="text-slate-400">{settings.contact_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Telepon</h3>
                  <p className="text-slate-400">{settings.contact_phone}</p>
                  <p className="text-slate-400">WhatsApp: {settings.contact_whatsapp}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email</h3>
                  <p className="text-slate-400">{settings.contact_email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Jam Operasional</h3>
                  <p className="text-slate-400">{settings.office_hours}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-4 pt-4">
                <Button asChild className="btn-shine bg-emerald-600 hover:bg-emerald-700">
                  <a
                    href={`https://wa.me/${settings.contact_whatsapp?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" className="border-slate-700 text-white">
                  <a href={settings.google_maps_link} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    Lihat di Maps
                  </a>
                </Button>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-slate-800 h-[400px]">
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
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <MapPin className="w-12 h-12" />
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
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">{settings.site_name}</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{settings.site_tagline}</p>
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

            {/* Quick Links */}
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

            {/* Portal */}
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
      <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
