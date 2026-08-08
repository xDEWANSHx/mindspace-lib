"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Settings,
  Database,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Sliders,
  Image as ImageIcon,
  User,
  Key,
  Plus,
  Save,
  Lock,
  Download,
  Upload,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import {
  eraseDatabaseData,
  getSystemSettings,
  saveSystemSettings,
  fetchMembers,
  fetchPayments,
  fetchExpenses,
  fetchActivityLogs
} from "@/lib/adminService";
import { getWhatsAppTemplates, saveWhatsAppTemplates } from "@/lib/whatsappTemplates";

export default function SettingsPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });

  const [capacity, setCapacity] = useState(150);
  const [eraseConfirm, setEraseConfirm] = useState("");
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState("admin");

  // Settings tab state
  const [settingsTab, setSettingsTab] = useState("VISITOR"); // VISITOR, WHATSAPP, SECURITY, BACKUP, CONFIG, ERASE

  // Visitor Site Gallery & Founder state
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImageTitle, setNewImageTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const [founderNote, setFounderNote] = useState("");
  const [founderPhoto, setFounderPhoto] = useState("");

  // WhatsApp Templates (Feature 1)
  const [waTemplates, setWaTemplates] = useState({});

  // Security password state
  const [adminPassword, setAdminPassword] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [passSaveMsg, setPassSaveMsg] = useState("");

  useEffect(() => {
    const loaded = getSystemSettings();
    setGalleryImages(loaded.galleryImages || []);
    setFounderNote(loaded.founderNote || "");
    setFounderPhoto(loaded.founderPhoto || "");
    setAdminPassword(loaded.adminPassword || "admin");
    setStaffPassword(loaded.staffPassword || "staff");

    setWaTemplates(getWhatsAppTemplates());

    const role = localStorage.getItem("mindspace_user_role") || "admin";
    setUserRole(role);
  }, []);

  const handleSaveVisitorSettings = (e) => {
    e.preventDefault();
    const curr = getSystemSettings();
    const updated = {
      ...curr,
      galleryImages,
      founderNote,
      founderPhoto
    };
    saveSystemSettings(updated, 'Admin');
    alert("Saved Visitor Site images and Founder Note updates!");
  };

  const handleAddGalleryImage = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    const newImg = {
      id: "img-" + Date.now(),
      title: newImageTitle || "Library Facility",
      url: newImageUrl
    };
    const updated = [...galleryImages, newImg];
    setGalleryImages(updated);
    setNewImageTitle("");
    setNewImageUrl("");
  };

  const handleRemoveGalleryImage = (id) => {
    const updated = galleryImages.filter(img => img.id !== id);
    setGalleryImages(updated);
  };

  const handleSaveWATemplates = (e) => {
    e.preventDefault();
    saveWhatsAppTemplates(waTemplates);
    alert("WhatsApp Message Templates saved successfully!");
  };

  const handleSavePasswords = (e) => {
    e.preventDefault();
    const curr = getSystemSettings();
    const updated = {
      ...curr,
      adminPassword,
      staffPassword
    };
    saveSystemSettings(updated, 'Admin');
    setPassSaveMsg("Security passwords updated successfully!");
    setTimeout(() => setPassSaveMsg(""), 3000);
  };

  // Feature 7: 1-Click System Data Backup Download
  const handleDownloadBackup = async () => {
    const [mList, pList, eList, lList] = await Promise.all([
      fetchMembers("main_branch"),
      fetchPayments("main_branch"),
      fetchExpenses("main_branch"),
      fetchActivityLogs("main_branch")
    ]);

    const backupPayload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      branch: activeBranch,
      members: mList,
      payments: pList,
      expenses: eList,
      logs: lList,
      settings: getSystemSettings(),
      whatsapp_templates: getWhatsAppTemplates()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mindspace_system_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Feature 7: Restore Data Backup
  const handleRestoreBackup = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.members) localStorage.setItem("mindspace_members", JSON.stringify(parsed.members));
          if (parsed.payments) localStorage.setItem("mindspace_payments", JSON.stringify(parsed.payments));
          if (parsed.expenses) localStorage.setItem("mindspace_expenses", JSON.stringify(parsed.expenses));
          if (parsed.logs) localStorage.setItem("mindspace_logs", JSON.stringify(parsed.logs));
          if (parsed.settings) localStorage.setItem("mindspace_settings", JSON.stringify(parsed.settings));
          alert("Backup data restored successfully! Reloading page...");
          window.location.reload();
        } catch (err) {
          alert("Invalid backup file format!");
        }
      };
    }
  };

  const sqlScript = `-- Supabase Complete DDL Script for Mindspace Library (6 Tables)

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 150,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(100) PRIMARY KEY,
    permanent_id VARCHAR(50) UNIQUE NOT NULL,
    student_no VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    mobile VARCHAR(20) NOT NULL,
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    aadhar_no VARCHAR(20),
    targeting_exam VARCHAR(100),
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    shift VARCHAR(50) NOT NULL DEFAULT 'Full Day',
    seat_no VARCHAR(20),
    previous_seat_no VARCHAR(20),
    has_locker BOOLEAN NOT NULL DEFAULT false,
    locker_no VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subscription_end_date DATE NOT NULL,
    plan_amount NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    outstanding_dues NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pay_later BOOLEAN DEFAULT false,
    due_date DATE,
    left_at TIMESTAMP WITH TIME ZONE,
    left_reason TEXT,
    left_with_dues BOOLEAN NOT NULL DEFAULT false,
    loss_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(100) PRIMARY KEY,
    member_id VARCHAR(100),
    invoice_id VARCHAR(50),
    member_name VARCHAR(150),
    amount NUMERIC(10, 2) NOT NULL,
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
    cash_amount NUMERIC(10, 2) DEFAULT 0.00,
    online_amount NUMERIC(10, 2) DEFAULT 0.00,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(100) PRIMARY KEY,
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY,
    branch VARCHAR(50) NOT NULL DEFAULT 'main_branch',
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    details TEXT NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'Admin',
    before_state TEXT,
    after_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Leads (Enquiries CRM) Table
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    interest VARCHAR(50) DEFAULT 'Full Day',
    status VARCHAR(50) DEFAULT 'new',
    branch VARCHAR(50) DEFAULT 'main_branch',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;

  const copySQL = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEraseDB = async (e) => {
    e.preventDefault();
    if (eraseConfirm !== "DELETE") {
      alert("Please type DELETE to confirm erasing all database entries!");
      return;
    }
    await eraseDatabaseData();
    alert("Database erased successfully.");
    window.location.reload();
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="max-w-5xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-600" />
              <span>System Settings & Content Management</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage visitor site images, WhatsApp message templates, system backups, and security
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 flex-wrap gap-1">
            {[
              { id: "VISITOR", label: "Visitor Branding", icon: ImageIcon },
              { id: "WHATSAPP", label: "WhatsApp Templates", icon: MessageSquare },
              { id: "BACKUP", label: "System Backup", icon: Download },
              { id: "SECURITY", label: "Security", icon: Key, adminOnly: true },
              { id: "CONFIG", label: "Capacity & DDL", icon: Sliders },
              { id: "ERASE", label: "Database Wipe", icon: Trash2, adminOnly: true }
            ].map(tab => {
              if (userRole === "staff" && tab.adminOnly) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    settingsTab === tab.id
                      ? "bg-white text-cyan-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: VISITOR SITE & BRANDING */}
        {settingsTab === "VISITOR" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600" />
                <span>Editor / Founder Note & Profile Photo Management</span>
              </h3>

              <form onSubmit={handleSaveVisitorSettings} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Founder / Editor Profile Photo Image URL</label>
                  <input
                    type="text"
                    value={founderPhoto}
                    onChange={(e) => setFounderPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Editor / Founder Message Note</label>
                  <textarea
                    rows={4}
                    value={founderNote}
                    onChange={(e) => setFounderNote(e.target.value)}
                    placeholder="Enter message note displayed on website..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none leading-relaxed font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Editor Note & Photo Updates</span>
                </button>
              </form>
            </div>

            {/* Visitor Site Gallery Images Management */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-600" />
                <span>Visitor Site Gallery Images</span>
              </h3>

              <form onSubmit={handleAddGalleryImage} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">+ Add New Image to Visitor Gallery</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Image Caption / Title"
                    value={newImageTitle}
                    onChange={(e) => setNewImageTitle(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Image to Gallery</span>
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryImages.map(img => (
                  <div key={img.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="h-40 bg-slate-100 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs truncate">{img.title}</span>
                      <button
                        onClick={() => handleRemoveGalleryImage(img.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHATSAPP TEMPLATES MANAGER */}
        {settingsTab === "WHATSAPP" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Customizable WhatsApp Message Templates Engine</span>
            </h3>

            <form onSubmit={handleSaveWATemplates} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold mb-1 block">1. Admission Welcome WhatsApp Message Template</label>
                <textarea
                  rows={3}
                  value={waTemplates.welcome || ""}
                  onChange={(e) => setWaTemplates({ ...waTemplates, welcome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none leading-relaxed font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold mb-1 block">2. Payment Receipt WhatsApp Template</label>
                <textarea
                  rows={3}
                  value={waTemplates.receipt || ""}
                  onChange={(e) => setWaTemplates({ ...waTemplates, receipt: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none leading-relaxed font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold mb-1 block">3. Dues & Expiry Renewal Reminder Template</label>
                <textarea
                  rows={3}
                  value={waTemplates.reminder || ""}
                  onChange={(e) => setWaTemplates({ ...waTemplates, reminder: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none leading-relaxed font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold mb-1 block">4. Overdue Urgent Alert Template</label>
                <textarea
                  rows={3}
                  value={waTemplates.overdue || ""}
                  onChange={(e) => setWaTemplates({ ...waTemplates, overdue: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none leading-relaxed font-medium"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save WhatsApp Message Templates</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SYSTEM DATA BACKUP & RESTORE */}
        {settingsTab === "BACKUP" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-xl">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-600" />
              <span>System Data Protection & Offline Backup</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm">Download Full System JSON Backup</h4>
                <p className="text-slate-500 leading-relaxed">
                  Downloads a complete offline backup of all student records, payment history, operational expenses, and activity logs.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="w-full p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download Complete Backup (.json)</span>
                </button>
              </div>

              <div className="bg-cyan-50/60 p-5 rounded-2xl border border-cyan-200 space-y-3">
                <h4 className="font-extrabold text-cyan-950 text-sm">Restore Data from Backup File</h4>
                <p className="text-cyan-800 leading-relaxed">
                  Restore previously saved system JSON backup file into your browser local storage.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY PASSWORDS (Admin Only) */}
        {settingsTab === "SECURITY" && userRole === "admin" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-xl">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-600" />
              <span>Change Admin & Staff Login Passwords</span>
            </h3>

            {passSaveMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{passSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePasswords} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold mb-1 block">Master Admin Login Password</label>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold mb-1 block">Staff Desk Login Password</label>
                <input
                  type="text"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Update Security Passwords</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: CAPACITY & SUPABASE DDL */}
        {settingsTab === "CONFIG" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-600" />
                    <span>Supabase Complete Database Schema DDL Script (6 Tables)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Includes branches, members, payments, expenses, activity_logs, and leads (CRM)</p>
                </div>
                <button
                  onClick={copySQL}
                  className="px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied SQL!" : "Copy SQL Script"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 font-mono text-[10px] text-cyan-300 max-h-72 overflow-y-auto custom-scrollbar">
                {sqlScript}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 6: DATABASE ERASE TOOL (Admin Only) */}
        {settingsTab === "ERASE" && userRole === "admin" && (
          <div className="bg-white border border-rose-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs max-w-xl">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wider border-b border-rose-100 pb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Database Reset & Data Erase Tool</span>
            </h3>
            <p className="text-slate-500 font-medium">
              Warning: This action will permanently erase all members, payments, expenses, and activity logs.
            </p>

            <form onSubmit={handleEraseDB} className="space-y-3">
              <div>
                <label className="text-slate-500 font-bold mb-1 block">Type &quot;DELETE&quot; to confirm database wipe & fresh scenario re-seed:</label>
                <input
                  type="text"
                  value={eraseConfirm}
                  onChange={(e) => setEraseConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-50 border border-rose-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Database & Seed Fresh Scenario Data</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
