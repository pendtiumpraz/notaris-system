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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import type { UserRole } from '@prisma/client';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  featureKey: string; // Maps to feature-flags.ts key
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'dashboard',
  },
  {
    label: 'Dokumen',
    href: '/documents',
    icon: <FileText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'documents',
  },
  {
    label: 'Jadwal',
    href: '/appointments',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'appointments',
  },
  {
    label: 'Pesan',
    href: '/messages',
    icon: <MessageSquare className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'messages',
  },
  {
    label: 'Ketersediaan',
    href: '/staff/availability',
    icon: <CalendarClock className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
    featureKey: 'staff_availability',
  },
  {
    label: 'Manajemen Pengguna',
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'user_management',
  },
  {
    label: 'Konten Website',
    href: '/admin/content',
    icon: <Globe className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'content_management',
  },
  {
    label: 'Google Drive',
    href: '/admin/drives',
    icon: <HardDrive className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'google_drive',
  },
  {
    label: 'Jenis Dokumen',
    href: '/admin/document-types',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'document_types',
  },
  {
    label: 'Layanan',
    href: '/admin/services',
    icon: <Building className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'services',
  },
  {
    label: 'Audit Log',
    href: '/admin/audit-logs',
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'audit_logs',
  },
  {
    label: 'Laporan',
    href: '/admin/reports',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'reports',
  },
  {
    label: 'Cabang',
    href: '/admin/branches',
    icon: <GitBranch className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'branches',
  },
  {
    label: 'Galeri',
    href: '/admin/gallery',
    icon: <Image className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'gallery',
  },
  {
    label: 'Notifikasi',
    href: '/notifications',
    icon: <Bell className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'notifications',
  },
  {
    label: 'Profil',
    href: '/profile',
    icon: <User className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
    featureKey: 'profile',
  },
  {
    label: 'AI Settings',
    href: '/admin/ai-settings',
    icon: <Bot className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    featureKey: 'ai_settings',
  },
  {
    label: 'License',
    href: '/admin/license',
    icon: <KeyRound className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
    featureKey: '__always__',
  },
  {
    label: 'Paket & Fitur',
    href: '/admin/feature-flags',
    icon: <Package className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
    featureKey: '__always__', // Always visible for SUPER_ADMIN
  },
  {
    label: 'Pengaturan',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
    featureKey: 'settings',
  },
];

interface SidebarProps {
  userRole: UserRole;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isFeatureEnabled } = useFeatureFlags();

  const filteredItems = sidebarItems.filter((item) => {
    // Must have role permission
    if (!item.roles.includes(userRole)) return false;

    // SUPER_ADMIN always sees everything
    if (userRole === 'SUPER_ADMIN') return true;

    // Special keys always visible
    if (item.featureKey === '__always__') return true;

    // Check feature flag for this specific role
    return isFeatureEnabled(item.featureKey, userRole);
  });

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
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.icon}
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
