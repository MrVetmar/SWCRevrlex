'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Trophy, Home, User, LogOut, Activity, Bookmark } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Canlı', href: '/live', icon: Activity },
    { name: 'Tahminlerim', href: '/my-predictions', icon: Bookmark },
    { name: 'Sıralama', href: '/leaderboard', icon: Trophy },
    { name: 'Profil', href: '/profile', icon: User },
  ];

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            SWC
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-sm font-medium text-white">{user.username}</span>
            <span className="text-xs text-blue-400 font-bold">{user.totalPoints} PUAN</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Çıkış yap"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around p-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all ${
                isActive ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
