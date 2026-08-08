"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  MessageSquare,
  Search,
  Plus,
  Phone,
  UserCheck,
  Trash2,
  Share2,
  Calendar,
  X,
  FileEdit,
  Save,
  CheckCircle2,
  Clock,
  Printer
} from "lucide-react";
import { formatDate, logActivity } from "@/lib/adminService";
import { supabase } from "@/lib/supabase";
import { exportListToPDF } from "@/lib/pdfExport";

export default function EnquiriesCRMPage() {
  const router = useRouter();
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, NEW, CONTACTED, CONVERTED
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name-asc
  
  // Add Lead Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    full_name: "",
    phone: "",
    interest: "Full Day",
    notes: ""
  });

  // Call Notes Modal State
  const [editingNoteLead, setEditingNoteLead] = useState(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    async function loadLeads() {
      let cloudLeads = [];
      try {
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          cloudLeads = data;
        }
      } catch (e) {}
      
      const localLeadsRaw = JSON.parse(localStorage.getItem("mindspace_leads") || "[]");
      const localEnqRaw = JSON.parse(localStorage.getItem("mindspace_enquiries") || "[]");

      // Normalize legacy enquiries format (name/mobile -> full_name/phone)
      const normalizedEnq = localEnqRaw.map(e => ({
        id: e.id || "lead-" + Date.now(),
        full_name: e.full_name || e.name || "Website Visitor",
        phone: e.phone || e.mobile || "N/A",
        interest: e.interest || e.shift || "Full Day",
        status: e.status === "Pending" ? "new" : (e.status || "new"),
        branch: "main_branch",
        notes: e.notes || `Email: ${e.email || 'N/A'} | Exam: ${e.purpose || 'N/A'} | Source: ${e.source || 'Website'} | Msg: ${e.message || 'N/A'}`,
        created_at: e.created_at || new Date().toISOString()
      }));

      // Combine all sources by ID
      const map = new Map();
      localLeadsRaw.forEach(item => { if (item && item.id) map.set(item.id, item); });
      normalizedEnq.forEach(item => { if (item && item.id && !map.has(item.id)) map.set(item.id, item); });
      cloudLeads.forEach(item => { if (item && item.id) map.set(item.id, item); });

      const combined = Array.from(map.values());
      if (combined.length === 0) {
        const initialLeads = [
          {
            id: "lead-1",
            full_name: "Rahul Verma",
            phone: "9876543210",
            interest: "Full Day",
            status: "new",
            notes: "Called on 05 Aug: Preparing for UPSC CSE. Asked for quiet corner seat near charging point.",
            created_at: new Date().toISOString()
          },
          {
            id: "lead-2",
            full_name: "Priya Sharma",
            phone: "9123456789",
            interest: "Evening",
            status: "contacted",
            notes: "Called on 04 Aug: College student, needs evening shift 2 PM to 9 PM. Will visit library tomorrow.",
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setLeads(initialLeads);
        localStorage.setItem("mindspace_leads", JSON.stringify(initialLeads));
      } else {
        setLeads(combined);
        localStorage.setItem("mindspace_leads", JSON.stringify(combined));
      }
    }
    loadLeads();
  }, [activeBranch]);

  const saveLeadsLocally = (updatedList) => {
    setLeads(updatedList);
    localStorage.setItem("mindspace_leads", JSON.stringify(updatedList));
  };

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    if (!newLead.full_name || !newLead.phone) return;

    const leadPayload = {
      id: "lead-" + Date.now(),
      full_name: newLead.full_name,
      phone: newLead.phone,
      interest: newLead.interest,
      status: "new",
      branch: activeBranch,
      notes: newLead.notes || "",
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('leads').insert([leadPayload]);
    } catch (e) {}

    const updated = [leadPayload, ...leads];
    saveLeadsLocally(updated);
    setShowAddModal(false);
    setNewLead({ full_name: "", phone: "", interest: "Full Day", notes: "" });

    await logActivity({
      branch: activeBranch,
      action_type: "enquiry_added",
      details: `Added new student enquiry lead for ${leadPayload.full_name} (${leadPayload.phone})`,
      performed_by: "Admin"
    });
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    } catch (e) {}

    const updated = leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    saveLeadsLocally(updated);
  };

  const handleSaveConversationNote = async (e) => {
    e.preventDefault();
    if (!editingNoteLead) return;

    try {
      await supabase.from('leads').update({ notes: noteText }).eq('id', editingNoteLead.id);
    } catch (e) {}

    const updated = leads.map(l => l.id === editingNoteLead.id ? { ...l, notes: noteText } : l);
    saveLeadsLocally(updated);

    await logActivity({
      branch: activeBranch,
      action_type: "enquiry_note_updated",
      details: `Updated call conversation notes for ${editingNoteLead.full_name}`,
      performed_by: "Admin"
    });

    setEditingNoteLead(null);
    setNoteText("");
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm("Are you sure you want to delete this enquiry lead?")) return;
    try {
      await supabase.from('leads').delete().eq('id', leadId);
    } catch (e) {}

    const updated = leads.filter(l => l.id !== leadId);
    saveLeadsLocally(updated);
  };

  const handleConvertToAdmission = async (lead) => {
    // Mark status as converted
    const updated = leads.map(l => l.id === lead.id ? { ...l, status: "converted" } : l);
    saveLeadsLocally(updated);
    try {
      await supabase.from('leads').update({ status: 'converted' }).eq('id', lead.id);
    } catch (e) {}

    router.push(`/dashboard/admission?name=${encodeURIComponent(lead.full_name)}&phone=${encodeURIComponent(lead.phone)}&shift=${encodeURIComponent(lead.interest || "Full Day")}`);
  };

  const handleWhatsAppOutreach = (lead) => {
    const msg = `Hello ${lead.full_name},\nThank you for inquiring at MindSpace Library!\nWe offer high-speed Wi-Fi, AC quiet study sanctuary, and reserved cabin workstations.\nWould you like to schedule a free sanctuary tour?`;
    window.open(`https://api.whatsapp.com/send?phone=91${lead.phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredLeads = leads.filter(l => {
    if (activeTab === "NEW" && l.status !== "new") return false;
    if (activeTab === "CONTACTED" && l.status !== "contacted") return false;
    if (activeTab === "CONVERTED" && l.status !== "converted") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return l.full_name.toLowerCase().includes(q) || l.phone.includes(q) || l.interest.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name-asc") return (a.full_name || "").localeCompare(b.full_name || "");
    if (sortBy === "oldest") {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    }
    // Default newest
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  const handleExportPDF = () => {
    const columns = ["Student Name", "Phone", "Interested Shift", "Status", "Call Conversation Notes"];
    const rows = filteredLeads.map(l => [
      l.full_name,
      l.phone,
      l.interest || "Full Day",
      l.status?.toUpperCase() || "NEW",
      l.notes || "-"
    ]);

    exportListToPDF({
      title: "Student Enquiry Leads CRM Report",
      columns,
      data: rows
    });
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0F172A]" />
              <span>Enquiries & Student Lead CRM</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage prospective student inquiries, track call notes, send WhatsApp tours, and convert leads to admissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Enquiry</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto">
            {["ALL", "NEW", "CONTACTED", "CONVERTED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search enquiries by name or phone..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Lead Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-semibold text-slate-700">No Enquiries Found</p>
              <p className="text-xs text-slate-500">There are no student leads matching your current search or tab filters.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{lead.full_name}</h3>
                      <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </p>
                    </div>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                        lead.status === "new"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : lead.status === "contacted"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                    </select>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <p><strong className="text-slate-800 font-medium">Interested Shift:</strong> <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{lead.interest}</span></p>
                    
                    {/* Call Conversation Notes Section */}
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          <FileEdit className="w-3 h-3 text-amber-600" />
                          <span>Call Conversation Notes</span>
                        </span>
                        <button
                          onClick={() => {
                            setEditingNoteLead(lead);
                            setNoteText(lead.notes || "");
                          }}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                        >
                          {lead.notes ? "Edit Note" : "+ Add Note"}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                        {lead.notes ? lead.notes : <span className="italic text-slate-400">No call conversation notes added yet. Click &quot;+ Add Note&quot; to log details of what was discussed.</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleWhatsAppOutreach(lead)}
                      className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Send WhatsApp Inquiry Response"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleConvertToAdmission(lead)}
                      className="px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Convert</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Edit Call Conversation Notes */}
        {editingNoteLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-amber-600" />
                  <span>Log Conversation Details — {editingNoteLead.full_name}</span>
                </h3>
                <button onClick={() => setEditingNoteLead(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveConversationNote} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Call Conversation Notes (&quot;Kya baat hui wo note karein&quot;) *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="e.g. Student called on 05 Aug. Inquired about AC quiet study hall & night shift timing. Promised to visit tomorrow at 4 PM."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-slate-900 text-slate-800 leading-relaxed font-sans"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNoteLead(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Conversation Note</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add New Enquiry */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Register Student Enquiry Lead</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newLead.full_name}
                    onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile number"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Interested Shift Plan</label>
                  <select
                    value={newLead.interest}
                    onChange={(e) => setNewLead({ ...newLead, interest: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-slate-900"
                  >
                    <option value="Full Day">Full Day (24x7 Access)</option>
                    <option value="Morning">Morning Shift (6 AM - 2 PM)</option>
                    <option value="Evening">Evening Shift (2 PM - 10 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Conversation Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Write details of what was discussed..."
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs"
                  >
                    Save Enquiry Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
