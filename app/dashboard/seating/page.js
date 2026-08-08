"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  LayoutGrid,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  Plus,
  Search,
  X,
  User,
  CreditCard,
  Send,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldAlert,
  Sliders,
  Check,
  RotateCcw,
  Users
} from "lucide-react";
import {
  fetchMembers,
  fetchBranches,
  updateMember,
  recordPayment,
  formatDate
} from "@/lib/adminService";
import Link from "next/link";

export default function SeatingMapPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });

  const [members, setMembers] = useState([]);
  const [capacity, setCapacity] = useState(150);
  const [selectedSeatNo, setSelectedSeatNo] = useState(null);
  const [selectedLockerNo, setSelectedLockerNo] = useState(null);
  const [searchStudent, setSearchStudent] = useState("");

  // Mode Tab: SEATS vs LOCKERS
  const [viewTab, setViewTab] = useState("SEATS"); // "SEATS" | "LOCKERS"

  // Assign Seat Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [targetMemberId, setTargetMemberId] = useState("");
  const [shiftChoice, setShiftChoice] = useState("Morning");
  const [conflictError, setConflictError] = useState("");
  const [showOnlyUnassignedSeats, setShowOnlyUnassignedSeats] = useState(true); // Filter to Unassigned students by default!

  // Assign Locker Modal
  const [assignLockerModalOpen, setAssignLockerModalOpen] = useState(false);
  const [lockerSearchQuery, setLockerSearchQuery] = useState("");
  const [targetLockerMemberId, setTargetLockerMemberId] = useState("");
  const [showAllForLocker, setShowAllForLocker] = useState(false); // Initially filter to only Locker-Requested students!

  useEffect(() => {
    async function load() {
      const [mList, bList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchBranches()
      ]);
      setMembers(mList);
      const b = bList.find(x => x.code === activeBranch);
      if (b) setCapacity(b.total_capacity || 150);
    }
    load();
  }, [activeBranch]);

  const reloadData = async () => {
    const [mList, bList] = await Promise.all([
      fetchMembers(activeBranch),
      fetchBranches()
    ]);
    setMembers(mList);
    const b = bList.find(x => x.code === activeBranch);
    if (b) setCapacity(b.total_capacity || 150);
  };

  // Tile Roster Filter Modal State
  const [filterModal, setFilterModal] = useState(null); // { title: string, type: "STUDENTS" | "SEATS" | "LOCKERS", items: array }
  const [filterSearchQuery, setFilterSearchQuery] = useState("");

  const activeMembers = members.filter(m => m.is_active && !m.left_at);

  // Seat stats
  const assignedTotal = activeMembers.filter(m => m.seat_no).length;
  const unassignedSeatsCount = activeMembers.filter(m => !m.seat_no).length;
  const morningCount = activeMembers.filter(m => m.shift === "Morning").length;
  const eveningCount = activeMembers.filter(m => m.shift === "Evening").length;
  const fullDayCount = activeMembers.filter(m => m.shift === "Full Day").length;

  const occupiedSeatsSet = new Set(activeMembers.filter(m => m.seat_no).map(m => m.seat_no));
  const occupiedCount = occupiedSeatsSet.size;
  const availableCount = Math.max(0, capacity - occupiedCount);

  // Locker stats
  const totalLockers = 50;
  const assignedLockersCount = activeMembers.filter(m => m.has_locker && m.locker_no).length;
  const availableLockersCount = Math.max(0, totalLockers - assignedLockersCount);
  const requestedLockersCount = activeMembers.filter(m => m.has_locker && !m.locker_no).length;

  // Helper to get occupants of a seat
  const getOccupants = (seatId) => {
    return activeMembers.filter(m => m.seat_no === seatId);
  };

  // Helper to get occupant of a locker
  const getLockerOccupant = (lockerId) => {
    return activeMembers.find(m => m.has_locker && m.locker_no === lockerId);
  };

  // Helper to open seat assignment modal with smart shift pre-selection
  const openSeatAssignModal = (seatId) => {
    const occs = getOccupants(seatId);
    const hasMorning = occs.some(o => o.shift === "Morning");
    const hasEvening = occs.some(o => o.shift === "Evening");

    if (hasMorning) {
      setShiftChoice("Evening");
    } else if (hasEvening) {
      setShiftChoice("Morning");
    } else {
      setShiftChoice("Full Day");
    }

    setSelectedSeatNo(seatId);
    setShowOnlyUnassignedSeats(true);
    setAssignModalOpen(true);
    setAssignSearchQuery("");
    setTargetMemberId("");
    setConflictError("");
  };

  // Search filter highlighting seat
  const searchedMember = searchStudent.trim()
    ? activeMembers.find(m => m.full_name?.toLowerCase().includes(searchStudent.toLowerCase()) || m.permanent_id?.toLowerCase().includes(searchStudent.toLowerCase()))
    : null;

  // Handle Assigning Member to Seat
  const handlePerformAssign = async (e) => {
    e.preventDefault();
    setConflictError("");
    if (!targetMemberId || !selectedSeatNo) return;

    const existingOccs = getOccupants(selectedSeatNo);
    const targetMem = activeMembers.find(m => m.id === targetMemberId);

    if (targetMem) {
      const chosenShift = shiftChoice;
      if (existingOccs.length > 0) {
        if (chosenShift === "Full Day" || existingOccs.some(m => m.shift === "Full Day")) {
          setConflictError(`Conflict: ${selectedSeatNo} is occupied by Full Day or requires exclusive access.`);
          return;
        }
        if (existingOccs.some(m => m.shift === chosenShift)) {
          setConflictError(`Conflict: ${selectedSeatNo} already has a student registered for ${chosenShift} Shift.`);
          return;
        }
      }

      const updates = {
        seat_no: selectedSeatNo,
        shift: chosenShift,
        status: 'ACTIVE',
        is_active: true
      };

      const endDate = new Date(targetMem.subscription_end_date);
      if (isNaN(endDate.getTime()) || endDate < new Date()) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        updates.subscription_end_date = formatDate(nextMonth);
      }

      await updateMember(targetMemberId, updates, 'Admin', targetMem);

      setAssignModalOpen(false);
      await reloadData();
      alert(`Seat ${selectedSeatNo} assigned to ${targetMem.full_name} (${chosenShift} Shift)!`);
    }
  };

  // Handle Assigning Member to Locker (Auto turn on has_locker toggle!)
  const handlePerformLockerAssign = async (e) => {
    e.preventDefault();
    if (!targetLockerMemberId || !selectedLockerNo) return;

    const targetMem = activeMembers.find(m => m.id === targetLockerMemberId);
    if (targetMem) {
      await updateMember(targetLockerMemberId, {
        has_locker: true, // Automatically set locker toggle ON!
        locker_no: selectedLockerNo
      }, 'Admin', targetMem);

      setAssignLockerModalOpen(false);
      await reloadData();
      alert(`Locker ${selectedLockerNo} assigned to ${targetMem.full_name}! (Locker toggle enabled)`);
    }
  };

  // Render Seat Node with Normal Font Weight, Grey Color & Diamond Symbols ♦
  const renderSeatNode = (num) => {
    const numStr = num.toString().padStart(3, "0");
    const seatId = `SEAT-${numStr}`;
    const occs = getOccupants(seatId);

    const isMatched = searchedMember && searchedMember.seat_no === seatId;
    const isSelected = selectedSeatNo === seatId;

    let nodeBg = "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100";

    if (occs.length === 1) {
      const occ = occs[0];
      if (occ.shift === "Full Day") {
        nodeBg = "bg-cyan-50 border-cyan-300 text-slate-800 shadow-2xs hover:bg-cyan-100";
      } else if (occ.shift === "Morning") {
        nodeBg = "bg-amber-50 border-amber-300 text-slate-800 shadow-2xs hover:bg-amber-100";
      } else if (occ.shift === "Evening") {
        nodeBg = "bg-purple-50 border-purple-300 text-slate-800 shadow-2xs hover:bg-purple-100";
      }
    } else if (occs.length > 1) {
      nodeBg = "bg-gradient-to-r from-amber-50 via-white to-purple-50 border-indigo-300 text-slate-900 shadow-2xs hover:border-indigo-400";
    }

    if (isSelected) {
      nodeBg += " ring-2 ring-cyan-500 scale-[1.03] z-10 shadow-md";
    }
    if (isMatched) {
      nodeBg += " ring-4 ring-amber-400 animate-pulse z-20";
    }

    return (
      <div
        key={seatId}
        onClick={() => setSelectedSeatNo(seatId)}
        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-20 relative select-none ${nodeBg}`}
      >
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] font-black opacity-60">{numStr}</span>
          {occs.length > 0 && (
            <span className="flex gap-1">
              {occs.map(o => (
                <span key={o.id} title={`${o.full_name} (${o.shift})`} className={`w-2 h-2 rounded-full ${
                  o.shift === "Morning" ? "bg-amber-500" :
                  o.shift === "Evening" ? "bg-purple-500" : "bg-cyan-500"
                }`} />
              ))}
            </span>
          )}
        </div>

        <div className="text-center truncate px-0.5">
          {occs.length === 0 ? (
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Vacant</span>
          ) : (
            <div className="text-[10px] font-normal text-slate-400 truncate leading-tight">
              ♦ {occs.map(o => o.full_name?.split(" ")[0]).join(" & ")} ♦
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Locker Node with Normal Font Weight, Grey Color & Diamond Symbols ♦
  const renderLockerNode = (num) => {
    const numStr = num.toString().padStart(2, "0");
    const lockerId = `LOCKER-${numStr}`;
    const occ = getLockerOccupant(lockerId);
    const isSelected = selectedLockerNo === lockerId;

    let nodeBg = "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100";
    if (occ) {
      nodeBg = "bg-purple-50 border-purple-300 text-slate-900 shadow-2xs hover:bg-purple-100";
    }
    if (isSelected) {
      nodeBg += " ring-2 ring-purple-500 scale-[1.03] z-10 shadow-md";
    }

    return (
      <div
        key={lockerId}
        onClick={() => setSelectedLockerNo(lockerId)}
        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-20 relative select-none ${nodeBg}`}
      >
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] font-black opacity-60">L-{numStr}</span>
          <Lock className={`w-3.5 h-3.5 ${occ ? "text-purple-600" : "text-emerald-500"}`} />
        </div>

        <div className="text-center truncate px-0.5">
          {occ ? (
            <div className="text-[10px] font-normal text-slate-400 truncate leading-tight">
              ♦ {occ.full_name?.split(" ")[0]} ♦
            </div>
          ) : (
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Available</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout activeBranch={activeBranch} setActiveBranch={setActiveBranch} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}>
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        {/* Top Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-cyan-600" />
              <span>Interactive Seat & Locker Assignment Map</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Visual seat allocation matrix & locker assignment management ({activeBranch === 'main_branch' ? 'Main Branch' : 'Executive Branch'})
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewTab("SEATS")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                viewTab === "SEATS" ? "bg-white text-cyan-600 shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Seating Map ({occupiedCount}/{capacity})</span>
            </button>

            <button
              onClick={() => setViewTab("LOCKERS")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                viewTab === "LOCKERS" ? "bg-white text-purple-600 shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Lockers Matrix ({assignedLockersCount}/{totalLockers})</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: SEATING MAP */}
        {viewTab === "SEATS" && (
          <div className="space-y-6">
            {/* Interactive KPI Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {/* Card 1: Total Assigned Seats */}
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Assigned Seats Student Roster", type: "STUDENTS", items: activeMembers.filter(m => m.seat_no) }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-cyan-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">Assigned Seats</p>
                  <p className="text-xl font-black text-cyan-600 font-mono">{assignedTotal}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{occupiedCount} Desks Occupied</p>
                </div>
                <Users className="w-6 h-6 text-cyan-500/30 group-hover:scale-110 transition-transform" />
              </div>

              {/* Card 2: Unassigned Students (NEW!) */}
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Unassigned Students (Need Seat Allocation)", type: "STUDENTS", items: activeMembers.filter(m => !m.seat_no) }); }}
                className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-2xs hover:shadow-md hover:border-rose-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider group-hover:text-rose-600 transition-colors">Unassigned Seats</p>
                  <p className="text-xl font-black text-rose-600 font-mono">{unassignedSeatsCount}</p>
                  <p className="text-[10px] text-rose-500 font-medium">No Seat Allocated</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-rose-500/40 group-hover:scale-110 transition-transform" />
              </div>

              {/* Card 3: Available Desks */}
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Vacant Available Desks List", type: "SEATS", items: Array.from({length: capacity}, (_, i) => "SEAT-" + String(i+1).padStart(3, '0')).filter(s => getOccupants(s).length === 0) }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Available Desks</p>
                  <p className="text-xl font-black text-emerald-600 font-mono">{availableCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{availableCount} Vacant Desks</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500/30 group-hover:scale-110 transition-transform" />
              </div>

              {/* Card 4: Morning Shift */}
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Morning Shift Students Roster", type: "STUDENTS", items: activeMembers.filter(m => m.shift === "Morning") }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Morning Shift</p>
                  <p className="text-xl font-black text-amber-600 font-mono">{morningCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Students</p>
                </div>
                <Sun className="w-6 h-6 text-amber-500/30 group-hover:scale-110 transition-transform" />
              </div>

              {/* Card 5: Evening Shift */}
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Evening Shift Students Roster", type: "STUDENTS", items: activeMembers.filter(m => m.shift === "Evening") }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Evening Shift</p>
                  <p className="text-xl font-black text-purple-600 font-mono">{eveningCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Students</p>
                </div>
                <Moon className="w-6 h-6 text-purple-500/30 group-hover:scale-110 transition-transform" />
              </div>

              {/* Card 6: Full Day Access */}
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Full Day Access Students Roster", type: "STUDENTS", items: activeMembers.filter(m => m.shift === "Full Day") }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider group-hover:text-slate-600 transition-colors">Full Day Access</p>
                  <p className="text-xl font-black text-slate-700 font-mono">{fullDayCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Exclusive</p>
                </div>
                <Clock className="w-6 h-6 text-slate-500/30 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Seat Matrix Grid */}
              <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Hall Seating Layout</span>
                    <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full font-bold border border-cyan-200">
                      Total Capacity: {capacity} Desks
                    </span>
                  </div>

                  {/* Search Student Seat */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      placeholder="Find student seat..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Section A: Main Quiet Study Zone (Desks 1 - 80) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Section A • Quiet Study Sanctuary (Desks 001 - 080)</span>
                  </h3>

                  <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
                    {Array.from({ length: 80 }, (_, i) => renderSeatNode(i + 1))}
                  </div>
                </div>

                {/* Section B: Dark Room Silent Zone (Desks 81 - 150) */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Section B • Silent Dark Room Zone (Desks 081 - {capacity})</span>
                  </h3>

                  <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
                    {Array.from({ length: Math.max(0, capacity - 80) }, (_, i) => renderSeatNode(i + 81))}
                  </div>
                </div>
              </div>

              {/* Right Panel: Selected Seat Details */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 h-fit sticky top-24">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>Selected Desk Details</span>
                  {selectedSeatNo && (
                    <span className="font-mono text-cyan-600 font-black">{selectedSeatNo}</span>
                  )}
                </h3>

                {!selectedSeatNo ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <LayoutGrid className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-bold">Select any seat on the map to view occupants or assign student</p>
                  </div>
                ) : (
                  <div>
                    {getOccupants(selectedSeatNo).length === 0 ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Desk is Vacant</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">This desk is currently available for allocation.</p>
                        </div>
                        <button
                          onClick={() => openSeatAssignModal(selectedSeatNo)}
                          className="w-full p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Assign Student to {selectedSeatNo}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getOccupants(selectedSeatNo).map((occ) => (
                          <div key={occ.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4 text-xs shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                                  {occ.full_name?.charAt(0)?.toUpperCase() || "S"}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900 text-sm">{occ.full_name}</p>
                                  <p className="text-[10px] text-cyan-700 font-mono font-bold">{occ.permanent_id || "STUDENT"}</p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                                occ.shift === "Morning" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                occ.shift === "Evening" ? "bg-purple-100 text-purple-800 border border-purple-300" :
                                "bg-cyan-100 text-cyan-800 border border-cyan-300"
                              }`}>
                                {occ.shift} Shift
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] font-medium bg-white p-3 rounded-2xl border border-slate-100">
                              <div>
                                <span className="text-slate-400 font-bold block text-[9px] uppercase">Mobile Number</span>
                                <span className="text-slate-800 font-mono font-bold">{occ.mobile || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold block text-[9px] uppercase">Subscription Expiry</span>
                                <span className="text-emerald-600 font-mono font-bold">{occ.subscription_end_date || "Active"}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <Link
                                href={`/dashboard/record-payment?memberId=${occ.id}`}
                                className="p-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 transition-all text-center"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Record Payment</span>
                              </Link>

                              <a
                                href={`https://wa.me/91${occ.mobile}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 transition-all text-center"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>

                              <button
                                onClick={async () => {
                                  await updateMember(occ.id, { seat_no: null, previous_seat_no: selectedSeatNo }, 'Admin', occ);
                                  await reloadData();
                                }}
                                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Release Seat</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* If seat has 1 occupant in Morning or Evening, allow adding second occupant! */}
                        {getOccupants(selectedSeatNo).length === 1 && getOccupants(selectedSeatNo)[0].shift !== "Full Day" && (
                          <button
                            onClick={() => openSeatAssignModal(selectedSeatNo)}
                            className="w-full p-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Assign {getOccupants(selectedSeatNo)[0].shift === "Morning" ? "Evening" : "Morning"} Shift Occupant</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LOCKERS MATRIX */}
        {viewTab === "LOCKERS" && (
          <div className="space-y-6">
            {/* Locker Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Assigned Lockers Roster", type: "STUDENTS", items: activeMembers.filter(m => m.has_locker && m.locker_no) }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Assigned Lockers</p>
                  <p className="text-xl font-black text-purple-600 font-mono">{assignedLockersCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{assignedLockersCount} of {totalLockers} Allocated</p>
                </div>
                <Lock className="w-6 h-6 text-purple-500/30 group-hover:scale-110 transition-transform" />
              </div>

              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Unassigned Locker Requested Students", type: "STUDENTS", items: activeMembers.filter(m => m.has_locker && !m.locker_no) }); }}
                className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-2xs hover:shadow-md hover:border-rose-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider group-hover:text-rose-600 transition-colors">Unassigned Lockers</p>
                  <p className="text-xl font-black text-rose-600 font-mono">{requestedLockersCount}</p>
                  <p className="text-[10px] text-rose-500 font-medium">Pending Locker Allocation</p>
                </div>
                <ShieldAlert className="w-6 h-6 text-rose-500/40 group-hover:scale-110 transition-transform" />
              </div>

              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Vacant Available Lockers List", type: "LOCKERS", items: Array.from({length: totalLockers}, (_, i) => "LOCKER-" + String(i+1).padStart(2, '0')).filter(l => !getLockerOccupant(l)) }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Available Lockers</p>
                  <p className="text-xl font-black text-emerald-600 font-mono">{availableLockersCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Vacant Lockable Vaults</p>
                </div>
                <Unlock className="w-6 h-6 text-emerald-500/30 group-hover:scale-110 transition-transform" />
              </div>

              <div
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Students Opted for Locker Facility", type: "STUDENTS", items: activeMembers.filter(m => m.has_locker) }); }}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider group-hover:text-slate-600 transition-colors">Locker Opted Total</p>
                  <p className="text-xl font-black text-slate-700 font-mono">{activeMembers.filter(m => m.has_locker).length}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Locker Requested ON</p>
                </div>
                <Sliders className="w-6 h-6 text-slate-500/30 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Locker Grid */}
              <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Locker Allocation Matrix</h3>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                    Total: {totalLockers} Lockers
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                  {Array.from({ length: totalLockers }, (_, i) => renderLockerNode(i + 1))}
                </div>
              </div>

              {/* Right Locker Details Panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 h-fit sticky top-24">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>Selected Locker Details</span>
                  {selectedLockerNo && (
                    <span className="font-mono text-purple-600 font-black">{selectedLockerNo}</span>
                  )}
                </h3>

                {!selectedLockerNo ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Lock className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-bold">Select any locker from the matrix to assign student or release</p>
                  </div>
                ) : (
                  <div>
                    {!getLockerOccupant(selectedLockerNo) ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <Unlock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Locker is Vacant</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">This locker is available for allocation.</p>
                        </div>
                        <button
                          onClick={() => { setAssignLockerModalOpen(true); setLockerSearchQuery(""); setTargetLockerMemberId(""); setShowAllForLocker(false); }}
                          className="w-full p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Assign {selectedLockerNo}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-purple-50/60 p-5 rounded-3xl border border-purple-200 space-y-4 text-xs shadow-sm">
                        {(() => {
                          const occ = getLockerOccupant(selectedLockerNo);
                          return (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                                  {occ.full_name?.charAt(0)?.toUpperCase() || "S"}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900 text-sm">{occ.full_name}</p>
                                  <p className="text-[10px] text-purple-700 font-mono font-bold">{occ.permanent_id || "STUDENT"}</p>
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded-2xl border border-purple-100 space-y-1">
                                <span className="text-slate-400 font-bold block text-[9px] uppercase">Mobile Number</span>
                                <span className="text-slate-800 font-mono font-bold">{occ.mobile || "N/A"}</span>
                              </div>

                              <button
                                onClick={async () => {
                                  await updateMember(occ.id, { locker_no: null }, 'Admin', occ);
                                  await reloadData();
                                }}
                                className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Release Locker Assignment</span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOR SEAT ASSIGNMENT (Filter to Unassigned Students + Shift Smart Filter) */}
        {assignModalOpen && selectedSeatNo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handlePerformAssign} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-4 shadow-2xl animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-700 font-extrabold bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                    {selectedSeatNo}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mt-1">Assign Student to Desk</h3>
                </div>
                <button type="button" onClick={() => setAssignModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informative Banner if seat has existing occupant */}
              {(() => {
                const existingOccs = getOccupants(selectedSeatNo);
                const hasMorningOcc = existingOccs.some(o => o.shift === "Morning");
                const hasEveningOcc = existingOccs.some(o => o.shift === "Evening");

                if (hasMorningOcc) {
                  return (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold space-y-1">
                      <p className="flex items-center gap-1.5 text-amber-800">
                        <Sun className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Seat has Morning Occupant: {existingOccs.find(o => o.shift === "Morning")?.full_name}</span>
                      </p>
                      <p className="text-[10px] text-amber-700 font-medium">Showing EVENING shift students only for dual-occupancy sharing.</p>
                    </div>
                  );
                }
                if (hasEveningOcc) {
                  return (
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold space-y-1">
                      <p className="flex items-center gap-1.5 text-purple-800">
                        <Moon className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Seat has Evening Occupant: {existingOccs.find(o => o.shift === "Evening")?.full_name}</span>
                      </p>
                      <p className="text-[10px] text-purple-700 font-medium">Showing MORNING shift students only for dual-occupancy sharing.</p>
                    </div>
                  );
                }
                return null;
              })()}

              {conflictError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{conflictError}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-500 font-bold text-xs">Search Student Member *</label>
                  <button
                    type="button"
                    onClick={() => setShowOnlyUnassignedSeats(!showOnlyUnassignedSeats)}
                    className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 underline cursor-pointer"
                  >
                    {showOnlyUnassignedSeats ? "Showing Unassigned Only (Toggle All)" : "Showing All Students"}
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    placeholder="Type student name, ID or mobile..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 pr-1 border border-slate-100 p-2 rounded-2xl bg-slate-50/50">
                  {(() => {
                    const existingOccs = selectedSeatNo ? getOccupants(selectedSeatNo) : [];
                    const hasMorningOcc = existingOccs.some(o => o.shift === "Morning");
                    const hasEveningOcc = existingOccs.some(o => o.shift === "Evening");

                    const candidates = activeMembers.filter(m => {
                      // 1. Filter to unassigned students initially
                      if (showOnlyUnassignedSeats && m.seat_no && m.seat_no.trim() !== "" && m.seat_no !== "-") {
                        return false;
                      }

                      // 2. Shift Smart Filter
                      if (hasMorningOcc && m.shift !== "Evening") {
                        return false; // Morning seat -> Only show Evening students!
                      }
                      if (hasEveningOcc && m.shift !== "Morning") {
                        return false; // Evening seat -> Only show Morning students!
                      }

                      // 3. Search query filter
                      if (!assignSearchQuery.trim()) return true;
                      const q = assignSearchQuery.toLowerCase();
                      return (
                        m.full_name?.toLowerCase().includes(q) ||
                        m.permanent_id?.toLowerCase().includes(q) ||
                        m.mobile?.includes(q)
                      );
                    });

                    if (candidates.length === 0) {
                      return (
                        <div className="text-center p-4 space-y-2">
                          <p className="text-xs text-slate-400 italic">No matching student found for this shift requirements.</p>
                          {showOnlyUnassignedSeats && (
                            <button
                              type="button"
                              onClick={() => setShowOnlyUnassignedSeats(false)}
                              className="text-[11px] font-bold text-cyan-600 underline"
                            >
                              Show All Students
                            </button>
                          )}
                        </div>
                      );
                    }

                    return candidates.map((m) => {
                      const isSelected = targetMemberId === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setTargetMemberId(m.id);
                            // Auto-adjust shift choice if candidate has a specific shift
                            if (m.shift) setShiftChoice(m.shift);
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-cyan-50 border-cyan-400 text-cyan-900 shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${isSelected ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                              {m.full_name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="font-bold">{m.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {m.permanent_id || "STUDENT"} • {m.shift || "No Shift"} • {m.seat_no ? `Curr: ${m.seat_no}` : "Unassigned"}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-600 shrink-0" />}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold text-xs mb-1 block">Assign Shift Plan</label>
                <select
                  value={shiftChoice}
                  onChange={(e) => setShiftChoice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-slate-800 outline-none font-bold text-xs"
                >
                  <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
                  <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
                  <option value="Full Day">Full Day Access (24 Hours Exclusive)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={!targetMemberId} className="flex-1 p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 cursor-pointer">Confirm Assignment</button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL FOR LOCKER ASSIGNMENT */}
        {assignLockerModalOpen && selectedLockerNo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <form onSubmit={handlePerformLockerAssign} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-4 shadow-2xl animate-popIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-purple-700 font-extrabold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {selectedLockerNo}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mt-1">Assign Locker to Student</h3>
                </div>
                <button type="button" onClick={() => setAssignLockerModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-500 font-bold text-xs">Search Student Member *</label>
                  <button
                    type="button"
                    onClick={() => setShowAllForLocker(!showAllForLocker)}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer"
                  >
                    {showAllForLocker ? "Showing All Students" : "Showing Locker-Requested Only"}
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={lockerSearchQuery}
                    onChange={(e) => setLockerSearchQuery(e.target.value)}
                    placeholder="Type student name, ID or mobile..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 pr-1 border border-slate-100 p-2 rounded-2xl bg-slate-50/50">
                  {(() => {
                    const candidateMembers = activeMembers.filter(m => {
                      const isUnassignedLocker = !m.locker_no;
                      const matchesLockerPreference = showAllForLocker ? isUnassignedLocker : (m.has_locker && isUnassignedLocker);

                      if (!matchesLockerPreference) return false;

                      if (!lockerSearchQuery.trim()) return true;
                      const q = lockerSearchQuery.toLowerCase();
                      return (
                        m.full_name?.toLowerCase().includes(q) ||
                        m.permanent_id?.toLowerCase().includes(q) ||
                        m.mobile?.includes(q)
                      );
                    });

                    if (candidateMembers.length === 0) {
                      return (
                        <div className="text-center p-4 space-y-2">
                          <p className="text-xs text-slate-400 italic">
                            {showAllForLocker ? "No unassigned student found." : "No student with Locker Requested found."}
                          </p>
                          {!showAllForLocker && (
                            <button
                              type="button"
                              onClick={() => setShowAllForLocker(true)}
                              className="text-[11px] font-bold text-purple-600 underline"
                            >
                              Show All Students
                            </button>
                          )}
                        </div>
                      );
                    }

                    return candidateMembers.map((m) => {
                      const isSelected = targetLockerMemberId === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setTargetLockerMemberId(m.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-purple-50 border-purple-400 text-purple-900 shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${isSelected ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                              {m.full_name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <p className="font-bold">{m.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {m.permanent_id || "STUDENT"} {m.has_locker ? "• Locker Requested" : ""}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignLockerModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={!targetLockerMemberId} className="flex-1 p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-purple-500/25 cursor-pointer">Confirm Locker Assignment</button>
              </div>
            </form>
          </div>
        )}

        {/* 🌟 INTERACTIVE TILE ROSTER FILTER MODAL 🌟 */}
        {filterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-2xl space-y-4 shadow-2xl animate-popIn max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-600" />
                    <span>{filterModal.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Click any record for quick seat / locker assignment</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full border border-cyan-200">
                    {filterModal.items.length} Records
                  </span>
                  <button type="button" onClick={() => setFilterModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Bar inside Modal */}
              <div className="relative shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={filterSearchQuery}
                  onChange={(e) => setFilterSearchQuery(e.target.value)}
                  placeholder="Filter roster list by name, ID, phone..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              {/* Scrollable Items Container */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 min-h-[250px]">
                {(() => {
                  const q = filterSearchQuery.toLowerCase().trim();
                  const filtered = filterModal.items.filter(item => {
                    if (!q) return true;
                    if (filterModal.type === "STUDENTS") {
                      return (
                        item.full_name?.toLowerCase().includes(q) ||
                        item.permanent_id?.toLowerCase().includes(q) ||
                        item.mobile?.includes(q) ||
                        item.shift?.toLowerCase().includes(q)
                      );
                    }
                    return String(item).toLowerCase().includes(q);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 text-xs italic">
                        No matching records found in this category.
                      </div>
                    );
                  }

                  if (filterModal.type === "STUDENTS") {
                    return filtered.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {m.full_name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-slate-900 text-sm">{m.full_name}</p>
                              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">{m.permanent_id}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Phone: <span className="font-mono font-bold text-slate-700">{m.mobile}</span> | Shift: <span className="font-bold text-cyan-700">{m.shift}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {m.seat_no ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200 text-[11px]">
                              {m.seat_no}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setFilterModal(null);
                                setTargetMemberId(m.id);
                                setAssignModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                            >
                              Assign Seat
                            </button>
                          )}

                          {m.has_locker ? (
                            m.locker_no ? (
                              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 font-mono font-bold border border-purple-200 text-[11px]">
                                Locker: {m.locker_no}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setFilterModal(null);
                                  setTargetLockerMemberId(m.id);
                                  setAssignLockerModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                              >
                                Assign Locker
                              </button>
                            )
                          ) : null}
                        </div>
                      </div>
                    ));
                  } else if (filterModal.type === "SEATS") {
                    return filtered.map((seatId) => (
                      <div key={seatId} className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                            {seatId.replace("SEAT-", "")}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm font-mono">{seatId}</p>
                            <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Vacant & Ready for Allocation</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setFilterModal(null);
                            openSeatAssignModal(seatId);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                        >
                          Assign to Student →
                        </button>
                      </div>
                    ));
                  } else if (filterModal.type === "LOCKERS") {
                    return filtered.map((lockerId) => (
                      <div key={lockerId} className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                            {lockerId.replace("LOCKER-", "L-")}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm font-mono">{lockerId}</p>
                            <p className="text-[11px] text-purple-700 font-bold uppercase tracking-wider">Available Lockable Vault</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setFilterModal(null);
                            setSelectedLockerNo(lockerId);
                            setAssignLockerModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                        >
                          Assign Locker →
                        </button>
                      </div>
                    ));
                  }
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
