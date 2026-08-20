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
  X,
  Share2,
  Edit3,
  Trash2
} from "lucide-react";
import {
  fetchPayments,
  fetchMembers,
  updatePaymentRecord,
  deletePayment
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";
import { openWhatsAppDirectMessage } from "@/lib/whatsappTemplates";

export default function InvoicesLedgerPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, amount-desc, amount-asc
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Edit Payment State
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    paid_at: "",
    amount: "",
    payment_mode: "Cash",
    notes: "",
    member_name: ""
  });

  const handleOpenEditPayment = (p) => {
    setEditingPayment(p);
    setEditForm({
      paid_at: p.paid_at ? p.paid_at.substring(0, 10) : "",
      amount: p.amount || 0,
      payment_mode: p.payment_mode || "Cash",
      notes: p.notes || "",
      member_name: p.member_name || "Student"
    });
  };

  const handleSavePaymentEdit = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;

    await updatePaymentRecord(editingPayment.id, editForm);
    setEditingPayment(null);

    const freshPayments = await fetchPayments(activeBranch);
    setPayments(freshPayments);
    alert(`Invoice ${editingPayment.invoice_id} updated successfully in Supabase database!`);
  };

  const handleDeletePaymentRecord = async (paymentId) => {
    if (!confirm("Are you sure you want to delete this payment record permanently from database? Revenue will be deducted, dues will be restored, and student expiry date will revert.")) return;
    await deletePayment(paymentId);
    const pList = await fetchPayments(activeBranch);
    setPayments(pList);
    alert("Payment record deleted permanently from backend database!");
  };

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
                        <button
                          onClick={() => handleOpenEditPayment(p)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="Edit Payment Date or Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
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
                        <button
                          onClick={() => handleDeletePaymentRecord(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="Delete Payment Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTERED THERMAL RECEIPT POPUP MODAL (80mm B&W ASPECT RATIO & PRINT ISOLATION) */}
        {previewInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #thermal-receipt-printable, #thermal-receipt-printable * {
                  visibility: visible !important;
                }
                #thermal-receipt-printable {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 80mm !important;
                  max-width: 80mm !important;
                  margin: 0 !important;
                  padding: 12px !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  font-family: monospace !important;
                  border: none !important;
                  box-shadow: none !important;
                }
              }
            `}</style>
            <div className="bg-white border border-slate-300 rounded-3xl p-6 w-full max-w-sm space-y-5 text-slate-900 shadow-2xl animate-popIn">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-slate-900 font-mono uppercase tracking-wider">Mindspace Thermal Printer POS</span>
                <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 80mm Standard High-Contrast Black & White Printable Thermal Box */}
              <div id="thermal-receipt-printable" className="bg-white border-2 border-slate-900 p-5 rounded-xl font-mono text-xs text-black space-y-3 shadow-xs">
                <div className="text-center border-b border-dashed border-black pb-3 space-y-0.5">
                  <h4 className="font-black text-sm uppercase tracking-wider text-black">MINDSPACE LIBRARY</h4>
                  <p className="text-[10px] text-black font-bold">AMBIKAPUR MAIN BRANCH</p>
                  <p className="text-[9px] text-black font-semibold">Phone: +91 79746 73138</p>
                  <p className="text-[10px] font-black uppercase mt-1.5 border border-black px-2 py-0.5 inline-block">OFFICIAL PAYMENT RECEIPT</p>
                </div>

                <div className="space-y-1 text-[11px] font-semibold text-black">
                  <div className="flex justify-between"><span>INVOICE:</span> <span className="font-black">{previewInvoice.invoice_id}</span></div>
                  <div className="flex justify-between"><span>DATE:</span> <span>{previewInvoice.paid_at ? previewInvoice.paid_at.substring(0, 10) : ""}</span></div>
                  <div className="flex justify-between"><span>STUDENT:</span> <span className="font-black uppercase">{previewInvoice.member_name}</span></div>
                  <div className="flex justify-between"><span>MODE:</span> <span className="uppercase">{previewInvoice.payment_mode}</span></div>
                </div>

                <div className="border-t border-b border-dashed border-black py-2 flex justify-between text-sm font-black text-black">
                  <span>TOTAL PAID:</span>
                  <span>₹{previewInvoice.amount}</span>
                </div>

                <div className="text-[9px] text-center text-black space-y-0.5 pt-1">
                  <p className="font-bold">--------------------------------</p>
                  <p className="font-semibold uppercase">Thank you for studying at MindSpace!</p>
                  <p className="font-bold">--------------------------------</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openWhatsAppDirectMessage(previewInvoice.member_mobile, `Receipt ${previewInvoice.invoice_id}: Payment ₹${previewInvoice.amount} received. Thank you!`)}
                  className="flex-1 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PAYMENT TRANSACTION MODAL (Allows updating Payment Date, Amount, Mode & Notes) */}
        {editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <form onSubmit={handleSavePaymentEdit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-600" />
                  <span>Edit Payment Record ({editingPayment.invoice_id})</span>
                </h3>
                <button type="button" onClick={() => setEditingPayment(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Student Name</label>
                  <input
                    type="text"
                    value={editForm.member_name}
                    onChange={(e) => setEditForm({ ...editForm, member_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-extrabold mb-1 block">Payment Date (paid_at)</label>
                  <input
                    type="date"
                    value={editForm.paid_at}
                    onChange={(e) => setEditForm({ ...editForm, paid_at: e.target.value })}
                    className="w-full bg-cyan-50/70 border-2 border-cyan-400 rounded-2xl p-3 text-slate-900 font-bold font-mono outline-none focus:border-cyan-600"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Select exact payment date. Updates Supabase database & subscription end date!</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-bold mb-1 block">Amount Paid (₹)</label>
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 font-bold mb-1 block">Payment Mode</label>
                    <select
                      value={editForm.payment_mode}
                      onChange={(e) => setEditForm({ ...editForm, payment_mode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="UPI">UPI</option>
                      <option value="Split">Split</option>
                      <option value="Deferred">Deferred</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Transaction Details / Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-900 font-medium"
                    placeholder="Subscription payment details..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="flex-1 p-3 rounded-2xl border border-slate-200 font-extrabold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 p-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
