/**
 * Feature Flags Management System
 * Controls visibility of sidebar menu items per-role based on subscription packages
 *
 * 3 Packages:
 * - complete: All features enabled for all roles
 * - no_ai: All features except AI-powered ones
 * - limited_ai: All features with limited AI (AI summarize only, no full AI editor tools)
 *
 * Feature visibility is controlled per-role: ADMIN, STAFF, CLIENT
 * SUPER_ADMIN always sees everything and cannot be restricted.
 */

export type ManageableRole = 'ADMIN' | 'STAFF' | 'CLIENT';
export const MANAGEABLE_ROLES: ManageableRole[] = ['ADMIN', 'STAFF', 'CLIENT'];

export const ROLE_LABELS: Record<ManageableRole, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CLIENT: 'Klien',
};

export const ROLE_COLORS: Record<ManageableRole, { bg: string; text: string; ring: string }> = {
  ADMIN: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500' },
  STAFF: { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500' },
  CLIENT: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500' },
};

export interface FeatureDefinition {
  key: string;
  label: string;
  description: string;
  category: 'core' | 'admin' | 'ai' | 'communication' | 'management' | 'billing';
  sidebarHref?: string; // Maps to sidebar item href
  applicableRoles: ManageableRole[]; // Which roles CAN potentially see this feature
  isAI: boolean;
  isFullAI: boolean; // true = full AI features, false = basic AI (summarize only)
}

// All features in the system
export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // Core features - available to all roles
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Halaman utama dashboard',
    category: 'core',
    sidebarHref: '/dashboard',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'documents',
    label: 'Dokumen',
    description: 'Manajemen dokumen klien',
    category: 'core',
    sidebarHref: '/documents',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'appointments',
    label: 'Jadwal',
    description: 'Penjadwalan dan janji temu',
    category: 'core',
    sidebarHref: '/appointments',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'messages',
    label: 'Pesan',
    description: 'Sistem pesan antar pengguna',
    category: 'communication',
    sidebarHref: '/messages',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'notifications',
    label: 'Notifikasi',
    description: 'Pusat notifikasi',
    category: 'communication',
    sidebarHref: '/notifications',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'profile',
    label: 'Profil',
    description: 'Pengaturan profil pengguna',
    category: 'core',
    sidebarHref: '/profile',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },

  // Staff features
  {
    key: 'staff_availability',
    label: 'Ketersediaan Staff',
    description: 'Jadwal ketersediaan staff',
    category: 'management',
    sidebarHref: '/staff/availability',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: false,
    isFullAI: false,
  },

  // Admin/Management features
  {
    key: 'user_management',
    label: 'Manajemen Pengguna',
    description: 'Kelola pengguna sistem',
    category: 'admin',
    sidebarHref: '/admin/users',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'content_management',
    label: 'Konten Website',
    description: 'Kelola konten halaman publik',
    category: 'admin',
    sidebarHref: '/admin/content',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'google_drive',
    label: 'Google Drive',
    description: 'Integrasi penyimpanan Google Drive',
    category: 'admin',
    sidebarHref: '/admin/drives',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'document_types',
    label: 'Jenis Dokumen',
    description: 'Kelola jenis-jenis dokumen',
    category: 'admin',
    sidebarHref: '/admin/document-types',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'services',
    label: 'Layanan',
    description: 'Kelola layanan yang tersedia',
    category: 'admin',
    sidebarHref: '/admin/services',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'audit_logs',
    label: 'Audit Log',
    description: 'Catatan aktivitas sistem',
    category: 'admin',
    sidebarHref: '/admin/audit-logs',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'reports',
    label: 'Laporan',
    description: 'Laporan dan analytics',
    category: 'admin',
    sidebarHref: '/admin/reports',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'branches',
    label: 'Cabang',
    description: 'Manajemen cabang kantor',
    category: 'admin',
    sidebarHref: '/admin/branches',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'gallery',
    label: 'Galeri',
    description: 'Kelola galeri foto website',
    category: 'admin',
    sidebarHref: '/admin/gallery',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'settings',
    label: 'Pengaturan',
    description: 'Pengaturan sistem',
    category: 'admin',
    sidebarHref: '/admin/settings',
    applicableRoles: ['ADMIN'],
    isAI: false,
    isFullAI: false,
  },

  // Billing & Financial
  {
    key: 'billing',
    label: 'Tagihan',
    description: 'Kelola invoice dan pembayaran klien',
    category: 'billing',
    sidebarHref: '/billing',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },

  // Notaris-specific
  {
    key: 'repertorium',
    label: 'Repertorium',
    description: 'Buku daftar akta notaris (wajib UU No. 2/2014)',
    category: 'core',
    sidebarHref: '/repertorium',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'klapper',
    label: 'Klapper',
    description: 'Indeks alfabetis penghadap akta',
    category: 'core',
    sidebarHref: '/klapper',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'document_templates',
    label: 'Template Akta',
    description: 'Template dokumen notaris untuk generate akta otomatis',
    category: 'admin',
    sidebarHref: '/admin/templates',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: false,
    isFullAI: false,
  },
  {
    key: 'document_checklist',
    label: 'Checklist Dokumen',
    description: 'Checklist persyaratan dokumen per jenis akta',
    category: 'core',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: false,
    isFullAI: false,
  },

  // AI Features
  {
    key: 'ai_settings',
    label: 'AI Settings',
    description: 'Konfigurasi provider dan model AI',
    category: 'ai',
    sidebarHref: '/admin/ai-settings',
    applicableRoles: ['ADMIN'],
    isAI: true,
    isFullAI: false,
  },
  {
    key: 'ai_document_editor',
    label: 'AI Document Editor',
    description: 'Generate, analisis, koreksi, revisi, terjemah dokumen dengan AI',
    category: 'ai',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: true,
    isFullAI: true,
  },
  {
    key: 'ai_summarize',
    label: 'AI Ringkasan',
    description: 'Ringkasan dokumen otomatis dengan AI',
    category: 'ai',
    applicableRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    isAI: true,
    isFullAI: false,
  },
  {
    key: 'ai_compare',
    label: 'AI Perbandingan',
    description: 'Bandingkan dokumen dengan AI',
    category: 'ai',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: true,
    isFullAI: true,
  },
  {
    key: 'ai_draft_reply',
    label: 'AI Draft Balasan',
    description: 'Generate draft balasan pesan dengan AI',
    category: 'ai',
    applicableRoles: ['ADMIN', 'STAFF'],
    isAI: true,
    isFullAI: true,
  },
  {
    key: 'ai_chatbot',
    label: 'AI Chatbot',
    description: 'Chatbot AI untuk klien di halaman publik',
    category: 'ai',
    applicableRoles: ['ADMIN', 'CLIENT'],
    isAI: true,
    isFullAI: true,
  },
];

// Feature flag key used in SiteSettings
export const FEATURE_FLAGS_KEY = 'feature_flags';

// Package presets
export type PackagePreset = 'complete' | 'no_ai' | 'limited_ai';

// Helper: build per-role enabled features from a filter function
function buildPerRoleFeatures(
  filterFn: (f: FeatureDefinition) => boolean
): Record<ManageableRole, string[]> {
  const result: Record<ManageableRole, string[]> = { ADMIN: [], STAFF: [], CLIENT: [] };
  for (const feature of FEATURE_DEFINITIONS) {
    if (filterFn(feature)) {
      for (const role of feature.applicableRoles) {
        result[role].push(feature.key);
      }
    }
  }
  return result;
}

export const PACKAGE_PRESETS: Record<
  PackagePreset,
  {
    label: string;
    description: string;
    color: string;
    icon: string;
    enabledFeatures: Record<ManageableRole, string[]>;
  }
> = {
  complete: {
    label: 'Paket Lengkap',
    description: 'Semua fitur aktif termasuk semua fitur AI untuk semua role',
    color: 'emerald',
    icon: '🏆',
    enabledFeatures: buildPerRoleFeatures(() => true),
  },
  no_ai: {
    label: 'Tanpa AI',
    description: 'Semua fitur dasar tanpa fitur AI untuk semua role',
    color: 'blue',
    icon: '📋',
    enabledFeatures: buildPerRoleFeatures((f) => !f.isAI),
  },
  limited_ai: {
    label: 'AI Terbatas',
    description: 'Fitur dasar + ringkasan AI dan konfigurasi AI',
    color: 'purple',
    icon: '🤖',
    enabledFeatures: buildPerRoleFeatures((f) => !f.isAI || !f.isFullAI),
  },
};

// Type for stored feature flags — PER ROLE
export interface FeatureFlags {
  activePackage: PackagePreset | 'custom';
  enabledFeatures: Record<ManageableRole, string[]>;
  updatedAt?: string;
}

// Default feature flags (complete package — all features for all roles)
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  activePackage: 'complete',
  enabledFeatures: buildPerRoleFeatures(() => true),
};

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  core: '🏠 Fitur Utama',
  admin: '⚙️ Admin & Manajemen',
  billing: '💰 Keuangan',
  ai: '🤖 Fitur AI',
  communication: '💬 Komunikasi',
  management: '👥 Staf',
};

// Helper: get all feature keys for a specific role
export function getAllFeatureKeysForRole(role: ManageableRole): string[] {
  return FEATURE_DEFINITIONS.filter((f) => f.applicableRoles.includes(role)).map((f) => f.key);
}
