"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  TrendingDown,
  DollarSign,
  UserCheck,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  HelpCircle,
  ShieldAlert
} from "lucide-react";
import {
  fetchMembers,
  fetchPayments,
  settleLossPayment
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function LossPaymentLedgerPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("loss-desc");
  const [userRole, setUserRole] = useState("admin");

  // Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [reactivate, setReactivate] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const [mList, pList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchPayments(activeBranch)
      ]);
      setMembers(mList);
      setPayments(pList);
      const role = localStorage.getItem("mindspace_user_role") || "admin";
      setUserRole(role);
    }
    load();
  }, [activeBranch]);

  const reloadData = async () => {
    const [mList, pList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setMembers(mList);
    setPayments(pList);
  };

  const defaulterMembers = members.filter(m => {
    const isDefaulter = m.left_with_dues && parseFloat(m.loss_amount || 0) > 0;
    if (!isDefaulter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.full_name?.toLowerCase().includes(q) || m.permanent_id?.toLowerCase().includes(q) || m.mobile?.includes(q);
    }
    return true;
  }).sort((a, b) => {
    const lossA = parseFloat(a.loss_amount || 0);
    const lossB = parseFloat(b.loss_amount || 0);
    if (sortBy === "loss-desc") return lossB - lossA;
    if (sortBy === "loss-asc") return lossA - lossB;
    if (sortBy === "name-asc") return (a.full_name || "").localeCompare(b.full_name || "");
    if (sortBy === "oldest") {
      const timeA = a.left_at ? new Date(a.left_at).getTime() : 0;
      const timeB = b.left_at ? new Date(b.left_at).getTime() : 0;
      return timeA - timeB;
    }
    const timeA = a.left_at ? new Date(a.left_at).getTime() : 0;
    const timeB = b.left_at ? new Date(b.left_at).getTime() : 0;
    return timeB - timeA;
  });

  // ALL-TIME Defaulters Loss Total
  const totalLossOutstanding = members
    .filter(m => m.left_with_dues && parseFloat(m.loss_amount || 0) > 0)
    .reduce((sum, m) => sum + parseFloat(m.loss_amount || 0), 0);

  const handlePerformSettle = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    await settleLossPayment({
      member_id: selectedMember.id,
      member_name: selectedMember.full_name,
      amount_paid: settleAmount,
      payment_mode: paymentMode,
      reactivate,
      notes,
      branch: activeBranch
    });

    setSelectedMember(null);
    await reloadData();
    alert(`Loss payment of ₹${settleAmount} settled for ${selectedMember.full_name}! Total loss ledger updated.`);
  };

  const handleExportPDF = () => {
    const columns = ["ID", "Student Name", "Mobile", "Father Name", "Left Date", "Loss Amount", "Reason for Leaving"];
    const rows = defaulterMembers.map(m => [
      m.permanent_id || "-",
      m.full_name,
      m.mobile,
      m.father_name || "-",
      m.left_at ? m.left_at.substring(0, 10) : "-",
      userRole === "staff" ? "••••••" : `Rs. ${m.loss_amount}`,
      m.left_reason || "Left without paying dues"
    ]);

    exportListToPDF({
      title: "All-Time Defaulters Payment Loss Report",
      columns,
      data: rows
    });
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              <span>All-Time Defaulters Loss Ledger</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Track students who left with unpaid dues, collect bad debt recovery payments, and add recovered funds back to total revenue
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 font-mono text-rose-700 font-bold text-xs">
              All-Time Defaulters Loss: {userRole === "staff" ? "•••••• (Staff Masked)" : `₹${totalLossOutstanding.toLocaleString()}`}
            </span>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-rose-400" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* UI Explanation Card */}
        <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50/50 border border-rose-200/80 rounded-3xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>How Payment Loss Logic Works (Defaulters Tracking):</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            यह सेक्शन उन स्टूडेंट्स को ऑल-टाइम ट्रैक करता है जो लगातार फ़ीस पेंडिंग रखते गए, ड्यू डेट आगे बढ़ाते रहे और अंततः बिना फ़ीस चुकाए लाइब्रेरी छोड़कर चले गए।
            जब किसी स्टूडेंट को <strong>Mark Left with Dues</strong> पर सेट किया जाता है, तो उसकी सीट और लॉकर तुरंत खाली होकर नए स्टूडेंट के लिए उपलब्ध हो जाते हैं, और उसका बचा हुआ बकाया अमाउंट यहाँ ऑल-टाइम रिकॉर्ड हो जाता है।
            अगर वह स्टूडेंट भविष्य में कभी वापस आकर फ़ीस चुकाता है, तो <strong>Settle Loss Fee</strong> बटन पर क्लिक करके उससे पैसे कलेक्ट किए जा सकते हैं, जो वापस <strong>Total Revenue</strong> में जुड़ जाएंगे।
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="loss-desc">Loss (High to Low)</option>
              <option value="loss-asc">Loss (Low to High)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search defaulter by Name, ID, or Mobile..."
              className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 shadow-sm"
            />
          </div>
        </div>

        {/* Defaulter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {defaulterMembers.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Defaulter Loss Outstanding</p>
              <p className="text-xs text-slate-400">All defaulter dues have been cleared or no left members with unpaid dues exist.</p>
            </div>
          ) : (
            defaulterMembers.map(m => (
              <div key={m.id} className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono text-[10px] font-black text-rose-400 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md block w-fit mb-1">
                        {m.permanent_id || "–"}
                      </span>
                      <h3 className="font-black text-slate-900 text-sm">{m.full_name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{m.mobile}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-medium">Loss Due</p>
                      <p className="text-xl font-black font-mono text-rose-600">
                        {userRole === "staff" ? "••••••" : `₹${m.loss_amount}`}
                      </p>
                    </div>
                  </div>
                  {m.left_reason && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-xs text-rose-700 italic">
                      &quot;{m.left_reason}&quot;
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { setSelectedMember(m); setSettleAmount(m.loss_amount); }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Settle Loss Fee</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Settle Loss Popup */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handlePerformSettle} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-4 shadow-2xl animate-popIn">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Settle Defaulter Loss Fee: {selectedMember.full_name}</h3>
              <div className="space-y-3 text-xs">
                <p className="text-rose-600 font-mono font-bold">Outstanding Defaulter Loss: ₹{selectedMember.loss_amount}</p>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Amount Collected Now (₹) *</label>
                  <input
                    type="number"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Online">Online Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Remarks / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Cleared loss fee upon return"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="reactivateMember"
                    checked={reactivate}
                    onChange={(e) => setReactivate(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <label htmlFor="reactivateMember" className="text-cyan-700 font-bold">Reactivate Membership Status</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedMember(null)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/25">Settle Fee & Record</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
