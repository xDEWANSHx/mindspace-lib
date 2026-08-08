"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Activity,
  Search,
  Printer,
  X,
  Eye,
  UserCheck,
  Shield,
  ArrowRight
} from "lucide-react";
import { fetchActivityLogs } from "@/lib/adminService";
import { exportListToPDF } from "@/lib/pdfExport";

export default function AuditTrailLogPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, STUDENTS, PAYMENTS, SEATING, EXPENSES, SETTINGS
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest
  const [selectedLog, setSelectedLog] = useState(null); // Selected log for Double-Click Diff Inspector Modal

  useEffect(() => {
    async function load() {
      const lList = await fetchActivityLogs(activeBranch);
      setLogs(lList);
    }
    load();
  }, [activeBranch]);

  const filteredLogs = logs.filter(l => {
    const action = (l.action_type || "").toLowerCase();

    if (activeTab === "STUDENTS") {
      if (!action.includes("student")) return false;
    } else if (activeTab === "PAYMENTS") {
      if (!action.includes("payment") && !action.includes("loss")) return false;
    } else if (activeTab === "SEATING") {
      if (!action.includes("seat") && !action.includes("locker")) return false;
    } else if (activeTab === "EXPENSES") {
      if (!action.includes("expense")) return false;
    } else if (activeTab === "SETTINGS") {
      if (!action.includes("setting") && !action.includes("password")) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.details?.toLowerCase().includes(q) ||
      l.action_type?.toLowerCase().includes(q) ||
      l.performed_by?.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
  });

  const handleExportPDF = () => {
    const columns = ["Timestamp", "Action Type", "Audit Details", "Performed By"];
    const rows = filteredLogs.map(l => [
      l.created_at ? l.created_at.replace("T", " ").substring(0, 19) : "-",
      l.action_type || "-",
      l.details || "-",
      `Done by ${l.performed_by || "Admin"}`
    ]);

    exportListToPDF({
      title: "Administrative Activity Audit Trail Log",
      columns,
      data: rows
    });
  };

  // Helper to parse JSON before/after state if present
  const parseStateObj = (stateVal) => {
    if (!stateVal) return null;
    if (typeof stateVal === "object") return stateVal;
    try {
      return JSON.parse(stateVal);
    } catch (e) {
      return { raw: stateVal };
    }
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              <span>Administrative Activity Audit Trail Log</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Immutable security audit log of admissions, renewals, seat/locker assignments & profile edits. Double-click row to inspect before/after diff.
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Export Log (PDF)</span>
          </button>
        </div>

        {/* Tab-wise Filter Tags & Search */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Tag Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto custom-scrollbar shadow-sm">
            {[
              { id: "ALL", label: "All Activities" },
              { id: "STUDENTS", label: "Students CRUD" },
              { id: "PAYMENTS", label: "Payments & Invoices" },
              { id: "SEATING", label: "Seats & Lockers" },
              { id: "EXPENSES", label: "Expenses" },
              { id: "SETTINGS", label: "Settings & System" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search log by action or user..."
                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Tag</th>
                  <th className="p-4">Audit Description</th>
                  <th className="p-4">Performed By (Actor)</th>
                  <th className="p-4 text-right">Inspect Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic font-sans font-medium">No activity logs found for the selected filter tag.</td></tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr
                      key={l.id}
                      onDoubleClick={() => setSelectedLog(l)}
                      className="hover:bg-cyan-50/50 cursor-pointer transition-colors"
                      title="Double-click to inspect Before/After change diff"
                    >
                      <td className="p-4 text-slate-500 text-[10px] font-mono whitespace-nowrap">
                        {l.created_at ? l.created_at.replace("T", " ").substring(0, 19) : "-"}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold text-[9px] border border-cyan-200 uppercase font-mono">
                          {l.action_type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-800 font-medium">{l.details}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                          <Shield className="w-3 h-3 text-cyan-600" />
                          <span>Done by {l.performed_by || "Admin"}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(l)}
                          className="px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-[11px] border border-cyan-200 shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Diff</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🌟 CENTERED MODAL POPUP FOR DOUBLE-CLICK BEFORE / AFTER DIFF INSPECTOR 🌟 */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-700 font-extrabold bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 uppercase">
                    {selectedLog.action_type}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1">Activity Audit & Diff Inspector</h2>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 rounded-2xl bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Log Meta info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Timestamp:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.created_at ? selectedLog.created_at.replace("T", " ").substring(0, 19) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Performed By (Actor):</span>
                  <span className="font-bold text-cyan-700">Done by {selectedLog.performed_by || "Admin"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Action Summary:</span>
                  <span className="font-bold text-slate-900">{selectedLog.details}</span>
                </div>
              </div>

              {/* Side-by-side Before vs After Diff Comparison */}
              {(() => {
                const beforeObj = parseStateObj(selectedLog.before_state);
                const afterObj = parseStateObj(selectedLog.after_state);

                if (!beforeObj && !afterObj) {
                  return (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 italic border border-slate-200">
                      Standard log entry recorded. No complex field diff snapshot stored for this action type.
                    </div>
                  );
                }

                // Keys to compare
                const allKeys = Array.from(new Set([
                  ...Object.keys(beforeObj || {}),
                  ...Object.keys(afterObj || {})
                ])).filter(k => !['id', 'created_at', 'updated_at'].includes(k));

                return (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Field-by-Field State Diff Comparison</h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-500 font-mono text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-3">Field Name</th>
                            <th className="p-3 bg-rose-50 text-rose-700">Before Change</th>
                            <th className="p-3 bg-emerald-50 text-emerald-700">After Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {allKeys.map(key => {
                            const valBefore = beforeObj ? String(beforeObj[key] ?? "N/A") : "N/A";
                            const valAfter = afterObj ? String(afterObj[key] ?? "N/A") : "N/A";
                            const isChanged = valBefore !== valAfter;

                            return (
                              <tr key={key} className={isChanged ? "bg-amber-50/40" : ""}>
                                <td className="p-3 font-bold text-slate-700 font-sans">{key}</td>
                                <td className={`p-3 ${isChanged ? "text-rose-600 font-bold bg-rose-50/50" : "text-slate-500"}`}>
                                  {valBefore}
                                </td>
                                <td className={`p-3 ${isChanged ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500"}`}>
                                  {valAfter}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
