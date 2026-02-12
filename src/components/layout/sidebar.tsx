'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  LayoutDashboard,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  HardDrive,
  Building,
  ClipboardList,
  Bell,
  User,
  ChevronLeft,
  Globe,
  BarChart3,
  GitBranch,
  Image,
  CalendarClock,
  Bot,
  Package,
  KeyRound,
  Receipt,
  Stamp,
  BookOpen,
  BookText,
  DollarSign,
  Brain,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import type { UserRole } from '@prisma/client';

type SidebarCategory = 'main' | 'notaris' | 'keuangan' | 'komunikasi' | 'manajemen' | 'pengaturan';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  featureKey?: string;
  category: SidebarCategory;
}

const CATEGORY_LABELS: Record<SidebarCategory, string> = {
  main: 'Utama',
  notaris: 'Notaris',
  keuangan: 'Keuangan',
  komunikasi: 'Komunikasi',
  manajemen: 'Manajemen',
  pengaturan: 'Pengaturan',
};

const sidebarItems: SidebarItem[] = [
  // ── Utama ──
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'dashboard',
    category: 'main',
  },
  {
    label: 'Dokumen',
    href: '/documents',
    icon: <FileText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'documents',
    category: 'main',
  },
  {
    label: 'Jadwal',
    href: '/appointments',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'appointments',
    category: 'main',
  },

  // ── Notaris ──
  {
    label: 'Repertorium',
    href: '/repertorium',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
    featureKey: 'repertorium',
    category: 'notaris',
  },
  {
    label: 'Klapper',
    href: '/klapper',
    icon: <BookText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
    featureKey: 'klapper',
    category: 'notaris',
  },
  {
    label: 'Template Akta',
    href: '/admin/templates',
    icon: <Stamp className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
    featureKey: 'document_templates',
    category: 'notaris',
  },

  // ── Keuangan ──
  {
    label: 'Tagihan',
    href: '/billing',
    icon: <Receipt className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'billing',
    category: 'keuangan',
  },
  {
    label: 'Tarif Layanan',
    href: '/admin/service-fees',
    icon: <DollarSign className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    category: 'keuangan',
  },
  {
    label: 'Laporan',
    href: '/admin/reports',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'reports',
    category: 'keuangan',
  },

  // ── Komunikasi ──
  {
    label: 'Pesan',
    href: '/messages',
    icon: <MessageSquare className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'messages',
    category: 'komunikasi',
  },
  {
    label: 'Notifikasi',
    href: '/notifications',
    icon: <Bell className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'notifications',
    category: 'komunikasi',
  },
  {
    label: 'Riwayat Chat',
    href: '/chat-history',
    icon: <History className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    category: 'komunikasi',
  },

  // ── Manajemen ──
  {
    label: 'Pengguna',
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'user_management',
    category: 'manajemen',
  },
  {
    label: 'Ketersediaan Staff',
    href: '/staff/availability',
    icon: <CalendarClock className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
    featureKey: 'staff_availability',
    category: 'manajemen',
  },
  {
    label: 'Jenis Dokumen',
    href: '/admin/document-types',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'document_types',
    category: 'manajemen',
  },
  {
    label: 'Layanan',
    href: '/admin/services',
    icon: <Building className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'services',
    category: 'manajemen',
  },
  {
    label: 'Cabang',
    href: '/admin/branches',
    icon: <GitBranch className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'branches',
    category: 'manajemen',
  },
  {
    label: 'Konten Website',
    href: '/admin/content',
    icon: <Globe className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'content_management',
    category: 'manajemen',
  },
  {
    label: 'Galeri',
    href: '/admin/gallery',
    icon: <Image className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'gallery',
    category: 'manajemen',
  },
  {
    label: 'Audit Log',
    href: '/admin/audit-logs',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'audit_logs',
    category: 'manajemen',
  },
  {
    label: 'AI Analytics',
    href: '/admin/ai-analytics',
    icon: <Brain className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    category: 'manajemen',
  },
  {
    label: 'Knowledge Base',
    href: '/admin/knowledge-base',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    category: 'manajemen',
  },

  // ── Pengaturan ──
  {
    label: 'Profil',
    href: '/profile',
    icon: <User className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'profile',
    category: 'pengaturan',
  },
  {
    label: 'AI Settings',
    href: '/admin/ai-settings',
    icon: <Bot className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'ai_settings',
    category: 'pengaturan',
  },
  {
    label: 'License',
    href: '/admin/license',
    icon: <KeyRound className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
    featureKey: '__always__',
    category: 'pengaturan',
  },
  {
    label: 'Paket & Fitur',
    href: '/admin/feature-flags',
    icon: <Package className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
    featureKey: '__always__',
    category: 'pengaturan',
  },
  {
    label: 'Pengaturan',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
    featureKey: 'settings',
    category: 'pengaturan',
  },
];

// Order of categories in sidebar
const CATEGORY_ORDER: SidebarCategory[] = [
  'main',
  'notaris',
  'keuangan',
  'komunikasi',
  'manajemen',
  'pengaturan',
];

interface SidebarProps {
  userRole: UserRole;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isFeatureEnabled, hasActiveLicense } = useFeatureFlags();

  const NO_LICENSE_ALLOWED_HREFS = ['/admin/license', '/admin/users', '/dashboard'];

  const filteredItems = sidebarItems.filter((item) => {
    if (!item.roles.includes(userRole)) return false;
    if (userRole === 'SUPER_ADMIN' && !hasActiveLicense) {
      return NO_LICENSE_ALLOWED_HREFS.includes(item.href);
    }
    if (userRole === 'SUPER_ADMIN') return true;
    if (item.featureKey === '__always__') return true;
    if (!item.featureKey) return true;
    return isFeatureEnabled(item.featureKey, userRole);
  });

  // Group by category, preserving order
  const groupedItems = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: filteredItems.filter((item) => item.category === cat),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && <span className="font-semibold text-white">Portal Notaris</span>}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft
            className={cn('w-5 h-5 transition-transform', isCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-4 overflow-y-auto h-[calc(100vh-4rem)]">
        {groupedItems.map((group) => (
          <div key={group.category}>
            {/* Category Label */}
            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            {isCollapsed && <div className="mx-auto w-6 border-t border-slate-800 mb-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
