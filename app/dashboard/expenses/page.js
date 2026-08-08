"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Building2,
  Zap,
  Wifi,
  Users,
  X,
  Printer,
  Search,
  ShieldAlert
} from "lucide-react";
import {
  fetchExpenses,
  fetchPayments,
  createExpense,
  deleteExpense,
  formatDate
} from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function ExpensesProfitPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [userRole, setUserRole] = useState("admin");

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Online");
  const [expenseDate, setExpenseDate] = useState(formatDate(new Date()));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const [eList, pList] = await Promise.all([
        fetchExpenses(activeBranch),
        fetchPayments(activeBranch)
      ]);
      setExpenses(eList);
      setPayments(pList);
      const role = localStorage.getItem("mindspace_user_role") || "admin";
      setUserRole(role);
    }
    load();
  }, [activeBranch]);

  const reloadData = async () => {
    const [eList, pList] = await Promise.all([
      fetchExpenses(activeBranch),
      fetchPayments(activeBranch)
    ]);
    setExpenses(eList);
    setPayments(pList);
  };

  const monthPayments = payments.filter(p => {
    const pMonth = p.paid_at ? p.paid_at.substring(0, 7) : formatDate(new Date()).substring(0, 7);
    return pMonth === selectedMonth;
  });

  // Today's payments for Staff view
  const todayStr = formatDate(new Date());
  const todayPayments = payments.filter(p => p.paid_at && p.paid_at.substring(0, 10) === todayStr);
  const todayTotalRevenue = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const totalRevenueMonth = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const monthExpenses = expenses.filter(e => {
    const eMonth = e.expense_date ? e.expense_date.substring(0, 7) : formatDate(new Date()).substring(0, 7);
    if (eMonth !== selectedMonth) return false;
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.title?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    const amtA = parseFloat(a.amount || 0);
    const amtB = parseFloat(b.amount || 0);
    if (sortBy === "amount-desc") return amtB - amtA;
    if (sortBy === "amount-asc") return amtA - amtB;
    if (sortBy === "oldest") {
      const timeA = a.expense_date ? new Date(a.expense_date).getTime() : 0;
      const timeB = b.expense_date ? new Date(b.expense_date).getTime() : 0;
      return timeA - timeB;
    }
    const timeA = a.expense_date ? new Date(a.expense_date).getTime() : 0;
    const timeB = b.expense_date ? new Date(b.expense_date).getTime() : 0;
    return timeB - timeA;
  });

  const totalExpensesMonth = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const netProfitMonth = totalRevenueMonth - totalExpensesMonth;

  const handleAddExpense = async (e) => {
    e.preventDefault();
    await createExpense({
      branch: activeBranch,
      title,
      category,
      amount: parseFloat(amount),
      payment_mode: paymentMode,
      expense_date: expenseDate,
      notes
    });

    setTitle("");
    setAmount("");
    setNotes("");
    setModalOpen(false);
    await reloadData();
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    await deleteExpense(id);
    await reloadData();
  };

  const handleExportPDF = () => {
    const columns = ["Title / Item", "Category", "Amount", "Mode", "Date", "Remarks"];
    const rows = monthExpenses.map(e => [
      e.title,
      e.category,
      `Rs. ${e.amount}`,
      e.payment_mode || "Cash",
      e.expense_date || "-",
      e.notes || "-"
    ]);

    exportListToPDF({
      title: `Operational Expenses Ledger (${selectedMonth})`,
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
              <DollarSign className="w-5 h-5 text-cyan-600" />
              <span>Library Expenses & Net Profit Calculator</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Track operational expenses (Rent, WiFi, Electricity, Salaries) & compute net monthly profit
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-600" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Expense</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Cards (Staff RBAC logic: Staff sees ONLY Today's Income) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 - Total / Today Revenue */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-500 tracking-wider">
                {userRole === "staff" ? "Today's Collection" : "Total Received Revenue"}
              </span>
            </div>
            <p className="text-3xl font-black text-emerald-700 font-mono">
              ₹{userRole === "staff" ? todayTotalRevenue.toLocaleString() : totalRevenueMonth.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-500 font-medium mt-1">
              {userRole === "staff" ? "Staff View: Today's collection only" : "Collected revenue this month"}
            </p>
          </div>

          {/* Card 2 - Expenses */}
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-extrabold text-rose-400 tracking-wider">Total Expenses</span>
            </div>
            <p className="text-3xl font-black text-rose-700 font-mono">
              {userRole === "staff" ? "••••••" : `₹${totalExpensesMonth.toLocaleString()}`}
            </p>
            <p className="text-[10px] text-rose-400 font-medium mt-1">
              {userRole === "staff" ? "Hidden for Staff Desk" : `${monthExpenses.length} transactions recorded`}
            </p>
          </div>

          {/* Card 3 - Net Income (Masked for Staff Desk) */}
          <div className={`${netProfitMonth >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'} border rounded-2xl p-6 shadow-sm flex flex-col justify-between`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${netProfitMonth >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                {netProfitMonth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] uppercase font-extrabold tracking-wider ${netProfitMonth >= 0 ? 'text-indigo-500' : 'text-rose-400'}`}>Net Income</span>
            </div>
            <p className={`text-3xl font-black font-mono ${netProfitMonth >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {userRole === "staff" ? "••••••" : `₹${netProfitMonth.toLocaleString()}`}
            </p>
            <p className={`text-[10px] font-medium mt-1 ${netProfitMonth >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {userRole === "staff" ? "Restricted for Staff Desk" : "Total Revenue minus Total Expenses"}
            </p>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Rent">Library Property Rent</option>
              <option value="Electricity">Electricity & AC Power</option>
              <option value="Salary">Staff & Cleaning Salary</option>
              <option value="WiFi">WiFi Internet</option>
              <option value="Maintenance">Maintenance & Repairs</option>
              <option value="Other">Other Expenses</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by title..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Title / Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 font-mono">Amount</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Expense Date</th>
                  <th className="p-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthExpenses.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-medium">No expenses recorded for {selectedMonth}.</td></tr>
                ) : (
                  monthExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{e.title}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold text-[9px] border border-cyan-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-black text-rose-600">₹{e.amount}</td>
                      <td className="p-4 font-mono text-slate-600">{e.payment_mode}</td>
                      <td className="p-4 font-mono text-slate-500">{e.expense_date}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FOR ADD EXPENSE */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handleAddExpense} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-4 shadow-2xl animate-popIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Record New Expense Entry</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Expense Title <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. WiFi Commercial Bill"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Category <span className="text-rose-500 font-bold">*</span></label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  >
                    <option value="Rent">Library Property Rent</option>
                    <option value="Electricity">Electricity & AC Power</option>
                    <option value="Salary">Staff & Cleaning Salary</option>
                    <option value="WiFi">High-Speed WiFi Internet</option>
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Amount Paid (₹) <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Payment Mode <span className="text-rose-500 font-bold">*</span></label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold"
                  >
                    <option value="Online">Online Bank Transfer</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Expense Date <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold mb-1 block">Remarks</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/25">Save Expense</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
