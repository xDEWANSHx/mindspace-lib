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
import { formatWhatsAppMessage, openWhatsAppDirectMessage } from "@/lib/whatsappTemplates";
import Link from "next/link";

export default function SeatingMapPage() {
  const [activeBranch, setActiveBranch] = useState("main_branch");
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });

  const [members, setMembers] = useState([]);
  const [capacity, setCapacity] = useState(113);
  const [selectedSeatNo, setSelectedSeatNo] = useState(null);
  const [hoveredSeatNo, setHoveredSeatNo] = useState(null);
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
  const [showAllForLocker, setShowAllForLocker] = useState(true); // Default to showing all active students so locker assignment is smooth & effortless!

  // Welcome WhatsApp Message Modal Popup
  const [welcomeModalData, setWelcomeModalData] = useState(null);

  useEffect(() => {
    async function load() {
      const [mList, bList] = await Promise.all([
        fetchMembers(activeBranch),
        fetchBranches()
      ]);
      setMembers(mList);
      const b = bList.find(x => x.code === activeBranch);
      if (b) setCapacity(b.code === "main_branch" ? 113 : (b.total_capacity || 113));

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "LOCKERS") {
          setViewTab("LOCKERS");
        }
      }
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
    if (b) setCapacity(b.code === "main_branch" ? 113 : (b.total_capacity || 113));
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

  // Helper to check if student is assigned to an actual physical vault (LOCKER-01 to 63)
  const isRealLockerAssigned = (m) => {
    if (!m.has_locker || !m.locker_no) return false;
    if (m.locker_no === "L-Express" || m.locker_no === "N/A" || m.locker_no === "Requested") return false;
    return m.locker_no.startsWith("LOCKER-") || m.locker_no.startsWith("L-0") || m.locker_no.startsWith("L-1") || m.locker_no.startsWith("L-2") || m.locker_no.startsWith("L-3") || m.locker_no.startsWith("L-4") || m.locker_no.startsWith("L-5") || m.locker_no.startsWith("L-6");
  };

  // Locker stats
  const totalLockers = 63;
  const assignedLockersCount = activeMembers.filter(m => isRealLockerAssigned(m)).length;
  const availableLockersCount = Math.max(0, totalLockers - assignedLockersCount);
  const requestedLockersCount = activeMembers.filter(m => m.has_locker && !isRealLockerAssigned(m)).length;

  // Helper to get occupants of a seat
  const getOccupants = (seatId) => {
    return activeMembers.filter(m => m.seat_no === seatId);
  };

  // Helper to get occupant of a locker
  const getLockerOccupant = (lockerId) => {
    return activeMembers.find(m => {
      if (!isRealLockerAssigned(m)) return false;
      if (m.locker_no === lockerId) return true;
      const numTarget = parseInt(lockerId.replace(/\D/g, ''), 10);
      const numMem = parseInt(m.locker_no.replace(/\D/g, ''), 10);
      return !isNaN(numTarget) && !isNaN(numMem) && numTarget === numMem;
    });
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

  // Helper to open locker assignment modal with default showAllForLocker = true
  const openLockerAssignModal = (lockerId) => {
    setSelectedLockerNo(lockerId);
    setLockerSearchQuery("");
    setTargetLockerMemberId("");
    setShowAllForLocker(true);
    setAssignLockerModalOpen(true);
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
      setWelcomeModalData({
        member: targetMem,
        seat_no: selectedSeatNo,
        shift: chosenShift,
        expiry_date: updates.subscription_end_date ? updates.subscription_end_date.substring(0, 10) : (targetMem.subscription_end_date ? targetMem.subscription_end_date.substring(0, 10) : "N/A"),
        locker_no: targetMem.locker_no || "N/A"
      });
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
      setWelcomeModalData({
        member: targetMem,
        seat_no: targetMem.seat_no || "Unassigned",
        locker_no: selectedLockerNo,
        shift: targetMem.shift || "Full Day",
        expiry_date: targetMem.subscription_end_date ? targetMem.subscription_end_date.substring(0, 10) : "N/A"
      });
    }
  };

  // Render Circular Seat Node matching Blueprint design
  const renderCircleSeatNode = (num, darkTheme = false) => {
    const numStr = num.toString().padStart(3, "0");
    const seatId = `SEAT-${numStr}`;
    const occs = getOccupants(seatId);

    const isMatched = searchedMember && searchedMember.seat_no === seatId;
    const isSelected = selectedSeatNo === seatId;
    const isHovered = hoveredSeatNo === seatId;

    let circleClasses = darkTheme
      ? "bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-emerald-400"
      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-emerald-500 shadow-xs";

    let labelColor = darkTheme ? "text-slate-400" : "text-slate-500";

    if (occs.length === 1) {
      const occ = occs[0];
      if (occ.shift === "Full Day") {
        circleClasses = darkTheme
          ? "bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)] font-black"
          : "bg-cyan-500 border-cyan-400 text-white shadow-xs font-black";
        labelColor = darkTheme ? "text-cyan-300" : "text-cyan-700";
      } else if (occ.shift === "Morning") {
        circleClasses = darkTheme
          ? "bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)] font-black"
          : "bg-amber-500 border-amber-400 text-white shadow-xs font-black";
        labelColor = darkTheme ? "text-amber-300" : "text-amber-700";
      } else if (occ.shift === "Evening") {
        circleClasses = darkTheme
          ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)] font-black"
          : "bg-purple-500 border-purple-400 text-white shadow-xs font-black";
        labelColor = darkTheme ? "text-purple-300" : "text-purple-700";
      }
    } else if (occs.length > 1) {
      circleClasses = darkTheme
        ? "bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 border-cyan-300 text-white shadow-md font-black"
        : "bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 border-cyan-400 text-white shadow-xs font-black";
      labelColor = darkTheme ? "text-cyan-200" : "text-indigo-700";
    } else {
      // Vacant
      circleClasses = darkTheme
        ? "bg-emerald-950/60 border-emerald-600/80 text-emerald-400 hover:bg-emerald-900/80 shadow-[0_0_6px_rgba(16,185,129,0.2)]"
        : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-xs";
      labelColor = darkTheme ? "text-emerald-500" : "text-emerald-600";
    }

    if (isSelected) {
      circleClasses += " ring-4 ring-cyan-400 scale-125 z-20 shadow-lg";
    } else if (isHovered) {
      circleClasses += " ring-2 ring-emerald-400 scale-110 z-10 shadow-md";
    }
    if (isMatched) {
      circleClasses += " ring-4 ring-amber-400 animate-bounce z-30";
    }

    const occupantNames = occs.map(o => o.full_name?.split(" ")[0]).join("&");

    return (
      <div
        key={seatId}
        onClick={() => setSelectedSeatNo(seatId)}
        onMouseEnter={() => setHoveredSeatNo(seatId)}
        onMouseLeave={() => setHoveredSeatNo(null)}
        title={`${seatId}: ${occs.length === 0 ? "Vacant" : occs.map(o => `${o.full_name} (${o.shift})`).join(", ")}`}
        className="group relative flex flex-col items-center justify-center cursor-pointer select-none py-0.5"
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all duration-200 ease-out flex items-center justify-center font-black text-xs group-hover:scale-125 group-hover:shadow-md ${circleClasses}`}>
          {num}
        </div>
        <span className={`text-[8px] sm:text-[9px] font-bold truncate max-w-[42px] text-center mt-0.5 leading-tight transition-colors duration-200 ${labelColor}`}>
          {occs.length === 0 ? "Vacant" : occupantNames}
        </span>
      </div>
    );
  };

  const renderSeatNode = (num) => renderCircleSeatNode(num, false);

  // Render Locker Node with Normal Font Weight, Grey Color & Diamond Symbols ♦
  const renderLockerNode = (num) => {
    const numStr = num.toString().padStart(3, "0");
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

                {/* Section A: LIGHT ROOM FLOOR PLAN (Desks 001 - 071) */}
                <div className="bg-slate-50/90 p-5 sm:p-7 rounded-3xl border-2 border-slate-300 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-xs" />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        SECTION A • LIGHT ROOM (Quiet Study Sanctuary — Desks 001 - 071)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" /> Vacant</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> Morning</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs" /> Evening</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-xs" /> Full Day</span>
                    </div>
                  </div>

                  {/* Blueprint Layout Container */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-inner relative space-y-6">
                    <div className="flex justify-between items-start gap-2 sm:gap-6 overflow-x-auto pb-2 min-w-[700px]">
                      {/* LEFT COLUMN: Seats 1-15 + Big Wall Box covering lower-left area */}
                      <div className="w-44 sm:w-56 flex flex-col justify-between self-stretch items-start relative flex-shrink-0">
                        {/* Column 1 (Seats 1 to 15) */}
                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Wall</span>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => renderCircleSeatNode(n, false))}
                        </div>

                        {/* Wall Box (Clean Wall Partition Box) */}
                        <div className="w-[230px] sm:w-[275px] flex-1 mt-16 sm:mt-24 rounded-2xl bg-emerald-50/70 border-2 border-emerald-500 shadow-sm min-h-[180px]" />
                      </div>

                      {/* LEFT AISLE */}
                      <div className="w-4 sm:w-6 flex flex-col items-center justify-center text-slate-300 font-mono text-[9px] uppercase tracking-widest self-stretch">
                        <span>AISLE</span>
                      </div>

                      {/* CENTER SECTION: ROW A & ROW B WITH FRONT SEATS DIRECTLY ALIGNED */}
                      <div className="flex-1 flex justify-center items-start">
                        {/* Center Island Group */}
                        <div className="flex gap-1.5 p-2 rounded-2xl bg-slate-100/90 border-2 border-slate-200 shadow-xs items-start">
                          {/* Row A (16 to 30) */}
                          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Row A</span>
                            {[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(n => renderCircleSeatNode(n, false))}
                          </div>

                          {/* Row B Column Group */}
                          <div className="flex flex-col gap-10 sm:gap-14 items-center">
                            {/* Row B (31 to 45) */}
                            <div className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-slate-200">
                              <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Row B</span>
                              {[31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45].map(n => renderCircleSeatNode(n, false))}
                            </div>

                            {/* SEPARATE FRONT BLOCK FOR SEATS 69, 70, 71 (TOUCHING WALL CORNER AT TOP OF SEAT 69) */}
                            <div className="flex flex-col gap-1 p-2 rounded-xl bg-amber-50/80 border-2 border-amber-300 min-w-[70px] shadow-xs">
                              <span className="text-[9px] font-black text-amber-800 text-center uppercase tracking-widest border-b border-amber-200 pb-1">Front</span>
                              {[69, 70, 71].map(n => renderCircleSeatNode(n, false))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT AISLE */}
                      <div className="w-4 sm:w-6 flex flex-col items-center justify-center text-slate-300 font-mono text-[9px] uppercase tracking-widest self-stretch">
                        <span>AISLE</span>
                      </div>

                      {/* RIGHT COLUMN: Fixed layout width matching left column */}
                      <div className="w-44 sm:w-56 flex flex-col items-end flex-shrink-0">
                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Wall</span>
                          {[46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68].map(n => renderCircleSeatNode(n, false))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Entrance Door */}
                    <div className="pt-4 border-t-2 border-slate-200 flex justify-center">
                      <div className="flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-black text-xs uppercase tracking-widest shadow-xs">
                        <span>🚪 MAIN ENTRANCE DOOR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: SILENT DARK ROOM FLOOR PLAN (Desks 072 - 113) */}
                <div className="bg-white p-5 sm:p-7 rounded-3xl border-2 border-slate-200 shadow-xl space-y-4 relative overflow-hidden text-slate-800">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400 shadow-xs animate-pulse" />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        SECTION B • SILENT DARK ROOM (Desks 072 - 113)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" /> Vacant</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> Morning</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs" /> Evening</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-xs" /> Full Day</span>
                    </div>
                  </div>

                  {/* Blueprint Layout Container (Light Blueprint Style) */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-inner relative space-y-6">
                    <div className="flex justify-between items-start gap-2 sm:gap-6 overflow-x-auto pb-2 min-w-[700px]">
                      {/* LEFT COLUMN: Outer Wall Seats 72-82 */}
                      <div className="w-44 sm:w-56 flex flex-col items-start flex-shrink-0">
                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Outer Wall</span>
                          {[72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82].map(n => renderCircleSeatNode(n, false))}
                        </div>
                      </div>

                      {/* LEFT AISLE */}
                      <div className="w-4 sm:w-6 flex flex-col items-center justify-center text-slate-300 font-mono text-[9px] uppercase tracking-widest self-stretch">
                        <span>AISLE</span>
                      </div>

                      {/* CENTER SECTION: ROW A & ROW B TOGETHER IN THE MID */}
                      <div className="flex-1 flex justify-center items-start">
                        {/* Center Island Group (Row A & Row B side-by-side) */}
                        <div className="flex gap-1.5 p-2 rounded-2xl bg-slate-100/90 border-2 border-slate-200 shadow-xs items-start">
                          {/* Inner Row A (83 to 92) */}
                          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Row A</span>
                            {[83, 84, 85, 86, 87, 88, 89, 90, 91, 92].map(n => renderCircleSeatNode(n, false))}
                          </div>

                          {/* Inner Row B (93 to 102) */}
                          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Row B</span>
                            {[93, 94, 95, 96, 97, 98, 99, 100, 101, 102].map(n => renderCircleSeatNode(n, false))}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT AISLE */}
                      <div className="w-4 sm:w-6 flex flex-col items-center justify-center text-slate-300 font-mono text-[9px] uppercase tracking-widest self-stretch">
                        <span>AISLE</span>
                      </div>

                      {/* RIGHT COLUMN: Outer Wall Seats 103-113 */}
                      <div className="w-44 sm:w-56 flex flex-col items-end flex-shrink-0">
                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-widest border-b border-slate-200 pb-1">Outer Wall</span>
                          {[103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113].map(n => renderCircleSeatNode(n, false))}
                        </div>
                      </div>
                    </div>
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
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Assigned Lockers Roster", type: "STUDENTS", items: activeMembers.filter(m => isRealLockerAssigned(m)) }); }}
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
                onClick={() => { setFilterSearchQuery(""); setFilterModal({ title: "Unassigned Locker Requested Students", type: "STUDENTS", items: activeMembers.filter(m => m.has_locker && !isRealLockerAssigned(m)) }); }}
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
                          onClick={() => openLockerAssignModal(selectedLockerNo)}
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
                    {showAllForLocker ? "Showing All Active Students (Filter Requested)" : "Showing Locker-Requested Only (Show All)"}
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
                      const isUnassignedPhysical = !isRealLockerAssigned(m) || m.locker_no !== selectedLockerNo;
                      const isLockerReq = Boolean(m.has_locker);

                      if (!showAllForLocker && !isLockerReq) return false;
                      if (!isUnassignedPhysical) return false;

                      if (!lockerSearchQuery.trim()) return true;
                      const q = lockerSearchQuery.toLowerCase();
                      return (
                        m.full_name?.toLowerCase().includes(q) ||
                        m.permanent_id?.toLowerCase().includes(q) ||
                        m.mobile?.includes(q)
                      );
                    }).sort((a, b) => {
                      const reqA = (a.has_locker && !isRealLockerAssigned(a)) ? 1 : 0;
                      const reqB = (b.has_locker && !isRealLockerAssigned(b)) ? 1 : 0;
                      return reqB - reqA;
                    });

                    if (candidateMembers.length === 0) {
                      return (
                        <div className="text-center p-4 space-y-2">
                          <p className="text-xs text-slate-400 italic">
                            {showAllForLocker ? "No unassigned active student found." : "No student with Locker Requested found."}
                          </p>
                          {!showAllForLocker && (
                            <button
                              type="button"
                              onClick={() => setShowAllForLocker(true)}
                              className="text-[11px] font-bold text-purple-600 underline"
                            >
                              Show All Active Students
                            </button>
                          )}
                        </div>
                      );
                    }

                    return candidateMembers.map((m) => {
                      const isSelected = targetLockerMemberId === m.id;
                      const isReq = Boolean(m.has_locker && !isRealLockerAssigned(m));
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
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold">{m.full_name}</p>
                                {isReq && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[9px] border border-purple-200">
                                    ✨ Locker Requested ({m.locker_no || "Requested"})
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {m.permanent_id || "STUDENT"} • {m.shift || "No Shift"} {isRealLockerAssigned(m) ? `• Curr: ${m.locker_no}` : "• Unassigned Locker"}
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

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-between">
                <span>Standard Storage Locker Fee:</span>
                <span className="font-mono font-black text-purple-700 bg-white px-2.5 py-1 rounded-xl border border-purple-200 text-xs">₹50 / Month</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignLockerModalOpen(false)} className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={!targetLockerMemberId} className="flex-1 p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-purple-500/25 cursor-pointer">Confirm Locker Assignment</button>
              </div>
            </form>
          </div>
        )}

        {/* INTERACTIVE TILE ROSTER FILTER MODAL */}
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
                            isRealLockerAssigned(m) ? (
                              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 font-mono font-bold border border-purple-200 text-[11px]">
                                Locker: {m.locker_no}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setFilterModal(null);
                                  openLockerAssignModal(selectedLockerNo || "LOCKER-001");
                                  setTargetLockerMemberId(m.id);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                              >
                                Assign Locker ({m.locker_no || "Requested"})
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
                          Assign to Student
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
                            openLockerAssignModal(lockerId);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                        >
                          Assign Locker
                        </button>
                      </div>
                    ));
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* WELCOME WHATSAPP MESSAGE POPUP MODAL */}
        {welcomeModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-2xl animate-popIn">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center font-black shadow-md shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Allocation Saved Successfully!</h3>
                  <p className="text-xs text-slate-500 font-medium">Send WhatsApp Welcome Message to Student</p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-950">
                <p className="font-extrabold text-sm text-emerald-900">{welcomeModalData.member.full_name}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <p><span className="font-bold text-slate-500">Seat:</span> <span className="font-black text-emerald-700">{welcomeModalData.seat_no}</span></p>
                  {welcomeModalData.locker_no && welcomeModalData.locker_no !== "N/A" && (
                    <p><span className="font-bold text-slate-500">Locker:</span> <span className="font-black text-purple-700">{welcomeModalData.locker_no}</span></p>
                  )}
                  <p><span className="font-bold text-slate-500">Shift:</span> <span className="font-bold text-slate-800">{welcomeModalData.shift}</span></p>
                  <p><span className="font-bold text-slate-500">Expiry:</span> <span className="font-bold text-slate-800">{welcomeModalData.expiry_date}</span></p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setWelcomeModalData(null)}
                  className="flex-1 p-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Close / Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tplKey = welcomeModalData.locker_no && welcomeModalData.locker_no !== "N/A" ? "seat_change" : "welcome";
                    const msg = formatWhatsAppMessage(tplKey, {
                      student_name: welcomeModalData.member.full_name || "Student",
                      seat_no: welcomeModalData.seat_no || "Unassigned",
                      shift: welcomeModalData.shift || "Full Day",
                      expiry_date: welcomeModalData.expiry_date,
                      locker_no: welcomeModalData.locker_no || "N/A"
                    });
                    openWhatsAppDirectMessage(welcomeModalData.member.mobile, msg);
                    setWelcomeModalData(null);
                  }}
                  className="flex-1 p-3 rounded-2xl bg-[#25D366] hover:bg-[#1db954] text-xs font-black text-white shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
