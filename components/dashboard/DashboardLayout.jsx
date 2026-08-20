"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Grid,
  TrendingDown,
  Clock,
  FileText,
  DollarSign,
  Activity,
  Settings,
  Building2,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle2,
  MessageSquare,
  Shield,
  UserCheck,
  BarChart3,
  BookOpen
} from "lucide-react";
import { fetchBranches, fetchMembers, fetchLeads, subscribeToCloudChanges } from "@/lib/adminService";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children, activeBranch, setActiveBranch, selectedMonth, setSelectedMonth }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [userName, setUserName] = useState("Harsh Goyal");
  const [userRole, setUserRole] = useState("admin"); // "admin" | "staff"

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Live Notification Badge Counts
  const [duesBadgeCount, setDuesBadgeCount] = useState(null);
  const [enquiriesBadgeCount, setEnquiriesBadgeCount] = useState(null);
  const [lossBadgeCount, setLossBadgeCount] = useState(null);

  const loadData = async () => {
    const bList = await fetchBranches();
    setBranches(bList);
    const savedRole = localStorage.getItem("mindspace_user_role");
    const name = localStorage.getItem("mindspace_user_name") || (savedRole === "admin" ? "Harsh Goyal (Admin)" : "Staff");
    setUserName(name);
    setUserRole(savedRole);

    // Calculate live counts for badges directly from cloud DB
    try {
      const mList = await fetchMembers(activeBranch || 'main_branch');
      const dueSoonOrOverdue = mList.filter(m => {
        if (!m.is_active || m.left_at) return false;
        const today = new Date();
        const endDate = new Date(m.subscription_end_date);
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 || m.outstanding_dues > 0;
      });
      const duesCount = dueSoonOrOverdue.length;
      setDuesBadgeCount(duesCount > 0 ? (duesCount > 9 ? "9+" : String(duesCount)) : null);

      const defaulters = mList.filter(m => m.left_with_dues && parseFloat(m.loss_amount || 0) > 0);
      setLossBadgeCount(defaulters.length > 0 ? String(defaulters.length) : null);

      // Enquiries leads count directly from cloud
      const leadsList = await fetchLeads(activeBranch || 'main_branch');
      const newLeads = leadsList.filter(l => l.status === "new");
      setEnquiriesBadgeCount(newLeads.length > 0 ? String(newLeads.length) : null);
    } catch (e) {}
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("mindspace_user_role");
    if (!savedRole || (savedRole !== "admin" && savedRole !== "staff")) {
      router.push("/login");
      return;
    }

    if (savedRole === "staff") {
      const restrictedPaths = [
        "/dashboard/analytics",
        "/dashboard/expenses",
        "/dashboard/settings",
        "/dashboard/activities",
        "/dashboard/loss-payment"
      ];
      if (restrictedPaths.includes(pathname)) {
        router.push("/dashboard");
        return;
      }
    }

    setIsAuthenticated(true);

    loadData();

    // Subscribe to realtime cloud updates across devices!
    const unsubscribe = subscribeToCloudChanges(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [activeBranch, router, pathname]);

  const handleRoleToggle = (newRole) => {
    setUserRole(newRole);
    localStorage.setItem("mindspace_user_role", newRole);
  };

  const navGroups = [
    {
      title: "NAVIGATION",
      items: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Students", href: "/dashboard/members", icon: Users },
        { label: "Admission", href: "/dashboard/admission", icon: UserPlus },
        { label: "Record Payment", href: "/dashboard/record-payment", icon: CreditCard },
        { label: "Seat & Lockers", href: "/dashboard/seating", icon: Grid },
      ]
    },
    {
      title: "MANAGEMENT",
      items: [
        { label: "Dues", href: "/dashboard/dues", icon: Clock, badge: duesBadgeCount },
        { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
        { label: "Enquiries", href: "/dashboard/enquiries", icon: MessageSquare, badge: enquiriesBadgeCount },
        { label: "System Rules & SOP", href: "/dashboard/rules", icon: BookOpen },
        ...(userRole === "staff" ? [] : [
          { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
          { label: "Expenses", href: "/dashboard/expenses", icon: DollarSign },
          { label: "Activities", href: "/dashboard/activities", icon: Activity },
          { label: "Loss Payments", href: "/dashboard/loss-payment", icon: TrendingDown, badge: lossBadgeCount },
          { label: "Settings", href: "/dashboard/settings", icon: Settings },
        ])
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("mindspace_user_role");
    localStorage.removeItem("mindspace_user_name");
    router.push("/login");
  };

  const monthsOptions = [
    { value: "ALL", label: "All Time (Total History)" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "2026-06", label: "June 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-04", label: "April 2026" },
    { value: "2026-03", label: "March 2026" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-01", label: "January 2026" },
    { value: "2025-12", label: "December 2025" },
    { value: "2025-11", label: "November 2025" },
    { value: "2025-10", label: "October 2025" },
  ];

  const allNavItems = navGroups.flatMap(g => g.items);
  const currentNav = allNavItems.find(i => i.href === pathname) || { label: "Overview" };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1C2421] flex items-center justify-center text-white font-body">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#00A8CC] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400">Authenticating Session Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Clean White Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 bg-white text-slate-700 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-100 shadow-sm ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Collapse Button Top Toggle */}
        <div className="pt-3 px-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/assets/logo.jpg" alt="Logo" width={24} height={24} className="rounded" />
            {!collapsed && <span className="text-xs font-black text-slate-900 tracking-tight">MindSpace</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Profile Header */}
        {!collapsed ? (
          <div className="pt-6 pb-6 px-4 text-center border-b border-slate-100/80 mb-2">
            <div className="relative w-16 h-16 mx-auto rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.25)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-900 text-[#feb685] font-black text-xl flex items-center justify-center border-2 border-white">
                {userRole === "staff" ? "S" : userName.charAt(0)}
              </div>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-3.5 tracking-tight">
              Welcome {userRole === "staff" ? "Staff" : userName.split(" ")[0]}
            </h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">
              {userRole === "admin" ? "Master Admin" : "Staff Desk User"}
            </p>
          </div>
        ) : (
          <div className="py-6 text-center border-b border-slate-100/80 mb-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 text-[#feb685] font-black text-sm flex items-center justify-center border-2 border-white shadow-sm">
              {userRole === "staff" ? "S" : userName.charAt(0)}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {!collapsed && (
                <p className="px-3 text-[10px] font-black text-slate-400 tracking-widest uppercase opacity-80">
                  {group.title}
                </p>
              )}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group relative ${
                        isActive
                          ? "bg-blue-50/80 text-[#2563EB] font-extrabold border border-blue-100 shadow-2xs"
                          : "text-[#64748B] hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-[#2563EB]" : "text-[#94A3B8] group-hover:text-slate-700"}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      
                      {/* Live Notification Red Badge */}
                      {item.badge && !collapsed && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-extrabold shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          {/* Mobile menu toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Dashboard</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-black">{currentNav.label}</span>
            </div>
          </div>

          {/* Controls: Fixed Locked Role Indicator, Branch & Month Selectors */}
          <div className="flex items-center gap-3">
            {/* RBAC Locked Role Indicator Badge */}
            {userRole === "staff" ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Staff Desk Mode</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Master Admin Mode</span>
              </div>
            )}

            {/* Branch Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-white transition-all">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch && setActiveBranch(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
              >
                {branches.map((b) => (
                  <option key={b.code} value={b.code} className="bg-white text-slate-900 font-medium">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Period Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-white transition-all">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth && setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
              >
                {monthsOptions.map((m) => (
                  <option key={m.value} value={m.value} className="bg-white text-slate-900 font-medium">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Sync Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Cloud Sync</span>
            </div>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
