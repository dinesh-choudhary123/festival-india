"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Gift,
  Users,
  Megaphone,
  CalendarDays,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "MAIN",
    items: [
      {
        name: "Topical Marketing",
        href: "/",
        icon: Megaphone,
        badge: "240",
      },
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Company", href: "/company", icon: Building2 },
      { name: "Offerings", href: "/offerings", icon: Gift },
      { name: "Consumer", href: "/consumer", icon: Users },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        name: "Moment Marketing",
        href: "/moment-marketing",
        icon: Sparkles,
      },
      { name: "Social Calendar", href: "/calendar", icon: CalendarDays },
      {
        name: "Content Library",
        href: "/content-library",
        icon: FolderOpen,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-[260px]"
      } bg-sidebar-bg text-sidebar-text flex flex-col transition-all duration-300 shrink-0 relative overflow-visible`}
    >
      {/* Floating re-open tab — only visible when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-5 h-10 bg-white border border-gray-200 rounded-r-md shadow-md flex items-center justify-center z-50 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={12} className="text-gray-500" />
        </button>
      )}
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">FI</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">
              Festival India
            </div>
            <div className="text-xs text-sidebar-text truncate">
              Social Media Calendar
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-sidebar-text hover:text-white p-1 rounded transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <div className="px-4 mb-2 text-[11px] font-semibold tracking-wider text-sidebar-heading uppercase">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/" && pathname === "/");
                const Icon = item.icon;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-active text-white border-r-2 border-brand-orange"
                          : "hover:bg-sidebar-hover hover:text-white"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto bg-brand-orange text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10 text-xs text-sidebar-heading">
          <div>Data: Calendarific + Curated</div>
          <div>Updated yearly for next 5 years</div>
        </div>
      )}
    </aside>
  );
}
