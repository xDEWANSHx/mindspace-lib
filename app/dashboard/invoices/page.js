"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  FileText,
  Printer,
  Search,
  CheckCircle2,
  Send,
  Eye,
  X
} from "lucide-react";
import {
  fetchPayments,
  fetchMembers
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function InvoicesLedgerPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, amount-desc, amount-asc
  const [previewInvoice, setPreviewInvoice] = useState(null);

  useEffect(() => {
    async function load() {
      const pList = await fetchPayments(activeBranch);
      setPayments(pList);
    }
    load();
  }, [activeBranch]);

  const filteredPayments = payments.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.invoice_id?.toLowerCase().includes(q) || p.member_name?.toLowerCase().includes(q) || p.payment_mode?.toLowerCase().includes(q);
  }).sort((a, b) => {
    const amtA = parseFloat(a.amount || 0);
    const amtB = parseFloat(b.amount || 0);
    if (sortBy === "amount-desc") return amtB - amtA;
    if (sortBy === "amount-asc") return amtA - amtB;
    if (sortBy === "oldest") {
      const timeA = a.paid_at ? new Date(a.paid_at).getTime() : 0;
      const timeB = b.paid_at ? new Date(b.paid_at).getTime() : 0;
      return timeA - timeB;
    }
    // Default newest
    const timeA = a.paid_at ? new Date(a.paid_at).getTime() : 0;
    const timeB = b.paid_at ? new Date(b.paid_at).getTime() : 0;
    return timeB - timeA;
  });

  const handleExportPDF = () => {
    const columns = ["Invoice ID", "Student Member", "Amount", "Payment Mode", "Date"];
    const rows = filteredPayments.map(p => [
      p.invoice_id || "-",
      p.member_name || "Student",
      `Rs. ${p.amount}`,
      p.payment_mode || "Cash",
      p.paid_at ? p.paid_at.substring(0, 10) : "-"
    ]);

    exportListToPDF({
      title: "Invoices Ledger Report",
      columns,
      data: rows
    });
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <span>Invoices Ledger & Thermal Print Generator</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Complete transaction invoice history, print thermal receipts, export PDF bill copies
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Export Invoices PDF</span>
          </button>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice ID, Member Name, Mode..."
              className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 shadow-sm"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Student Member</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-medium">No invoices found.</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-cyan-700">{p.invoice_id}</td>
                      <td className="p-4 font-bold text-slate-900">{p.member_name || "Student"}</td>
                      <td className="p-4 font-mono font-black text-emerald-600">₹{p.amount}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-mono text-[9px] font-bold border border-cyan-200">
                          {p.payment_mode}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[10px]">{p.paid_at ? p.paid_at.substring(0, 10) : ""}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Link
                          href={`/invoice?id=${p.invoice_id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Official A4 Invoice</span>
                        </Link>
                        <button
                          onClick={() => setPreviewInvoice(p)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Thermal</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTERED THERMAL RECEIPT POPUP MODAL */}
        {previewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-sm space-y-6 text-slate-900 shadow-2xl animate-popIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-cyan-700 font-mono uppercase">Mindspace Thermal Receipt</span>
                <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-xs space-y-3 shadow-inner">
                <div className="text-center border-b border-slate-200 pb-3">
                  <h4 className="font-black text-slate-900 tracking-wider">MINDSPACE LIBRARY</h4>
                  <p className="text-[9px] text-slate-500">Sector 62, Noida Branch</p>
                  <p className="text-[9px] text-cyan-700 font-bold mt-1">OFFICIAL PAYMENT RECEIPT</p>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-400">Invoice:</span> <span className="text-cyan-700 font-bold">{previewInvoice.invoice_id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Date:</span> <span className="text-slate-700">{previewInvoice.paid_at ? previewInvoice.paid_at.substring(0, 10) : ""}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Student:</span> <span className="text-slate-900 font-bold">{previewInvoice.member_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Mode:</span> <span className="text-cyan-700">{previewInvoice.payment_mode}</span></div>
                </div>

                <div className="border-t border-b border-slate-200 py-2.5 flex justify-between text-sm font-black">
                  <span className="text-slate-800">TOTAL PAID:</span>
                  <span className="text-emerald-600">₹{previewInvoice.amount}</span>
                </div>

                <p className="text-[9px] text-center text-slate-500 italic pt-1">Thank you for studying with Mindspace Library!</p>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
