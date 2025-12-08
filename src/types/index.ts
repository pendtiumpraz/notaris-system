import { UserRole, DocumentStatus, DocumentPriority, AppointmentStatus } from '@prisma/client';

export type { UserRole, DocumentStatus, DocumentPriority, AppointmentStatus };

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}
