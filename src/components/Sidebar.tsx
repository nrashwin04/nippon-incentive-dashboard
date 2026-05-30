"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Car,
  Calculator,
  Users,
  BarChart2,
  Settings,
  User,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, userName } = useAuth();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Inventory", href: "/admin/cars", icon: Car },
    { name: "Slabs", href: "/admin/slabs", icon: Calculator },
    { name: "Employees", href: "/admin/employees", icon: Users },
  ];

  const officerLinks = [
    { name: "Dashboard", href: "/officer/dashboard", icon: LayoutDashboard },
    { name: "Calculator", href: "/officer/calculator", icon: Calculator },
    { name: "My Profile", href: "/officer/profile", icon: User },
  ];

  const links = role === "admin" ? adminLinks : role === "officer" ? officerLinks : [];

  // Helper for user initials
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-screen w-[240px] flex-col justify-between bg-[var(--bg-sidebar)] md:flex fixed top-0 left-0 z-10">
        <div>
          {/* Top Header */}
          <div className="flex flex-col items-center py-8">
            <div className="mb-4 flex items-center justify-center px-4 w-full">
              <img src="/dashboardlogo.png" alt="Nippon Toyota" className="h-20 w-auto object-contain" />
            </div>
            <h2 className="font-heading text-lg font-bold text-white">Nippon Toyota</h2>
            <p className="text-xs text-[var(--text-muted)]">Kochi Branch</p>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex flex-col space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-3 rounded-r-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-l-4 border-[var(--toyota-red)] bg-[#2A2A2A] text-white"
                      : "text-[#9A9A9A] hover:bg-[#2A2A2A] hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile */}
        <div className="flex items-center justify-between border-t border-[#2A2A2A] p-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--toyota-red)] text-xs font-bold text-white">
              {getInitials(userName)}
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-sm font-medium text-white">{userName || "User"}</span>
              <span className="text-xs text-[var(--text-muted)] capitalize">{role || "Loading..."}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 p-2 text-[#9A9A9A] transition-colors hover:text-white"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 z-50 flex w-full border-t border-[var(--border-user)] bg-[var(--bg-card)] md:hidden">
        {links.slice(0, 4).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-1 flex-col items-center justify-center space-y-1 py-3 transition-colors ${
                isActive ? "text-[var(--toyota-red)]" : "text-[var(--text-muted)] hover:text-[var(--text-dark)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
