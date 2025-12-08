'use client';

import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { Bell, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { UserRole } from '@prisma/client';

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CLIENT: 'Klien',
};

const roleBadgeColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400',
  ADMIN: 'bg-purple-500/20 text-purple-400',
  STAFF: 'bg-blue-500/20 text-blue-400',
  CLIENT: 'bg-emerald-500/20 text-emerald-400',
};

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
  };
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          </Button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  roleBadgeColors[user.role]
                }`}
              >
                {roleLabels[user.role]}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-slate-400 hover:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
