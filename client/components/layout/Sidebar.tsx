'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Upload, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Subjects', href: '/dashboard/subjects', icon: BookOpen },
  { name: 'Students', href: '/dashboard/students', icon: Users },
  { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, comingSoon: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold text-gray-900">Smart Grading</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.comingSoon ? '#' : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-gray-100 group relative",
                isActive && "bg-blue-50 text-blue-600",
                item.comingSoon && "cursor-not-allowed opacity-60"
              )}
            >
              <Icon size={20} />
              {!collapsed && (
                <span className="font-medium">
                  {item.name}
                  {item.comingSoon && (
                    <span className="text-xs text-gray-500 ml-2">(Soon)</span>
                  )}
                </span>
              )}
              
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                  {item.comingSoon && " (Coming Soon)"}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-red-600 w-full">
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}