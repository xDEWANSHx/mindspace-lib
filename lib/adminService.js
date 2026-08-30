import { supabase } from './supabase.js';

// Helper to format date strings YYYY-MM-DD
export function formatDate(date) {
  const d = new Date(date || new Date());
  return d.toISOString().split('T')[0];
}

// Helper to add exactly 1 month to YYYY-MM-DD date string
export function addOneMonth(dateStr) {
  if (!dateStr) return "";
  const str = dateStr.substring(0, 10);
  const parts = str.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const [y, m, d] = parts;
  const targetDate = new Date(y, m, d);
  if (targetDate.getDate() !== d) {
    targetDate.setDate(0);
  }
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to subtract exactly 1 month from YYYY-MM-DD date string
export function subtractOneMonth(dateStr) {
  if (!dateStr) return "";
  const str = String(dateStr).substring(0, 10);
  const parts = str.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return dateStr;
  const [y, m, d] = parts;
  const targetDate = new Date(y, m - 2, d);
  if (targetDate.getDate() !== d) {
    targetDate.setDate(0);
  }
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Single Source of Truth Helper for Member Subscription Dates
export function getMemberSubscriptionDates(member, payments = []) {
  if (!member) {
    return { initialAdmissionDate: "--", subStart: "--", subExpiry: "--" };
  }

  const initialAdmissionDate = member.joining_date || "--";
  const rawSubEnd = (member.subscription_end_date && String(member.subscription_end_date).trim() !== "" && !String(member.subscription_end_date).startsWith("1970")) ? member.subscription_end_date : "--";

  const memPayments = (payments || []).filter(p =>
    p.member_id === member.id ||
    p.member_id === member.permanent_id ||
    p.member_id === member.student_no ||
    (p.member_name && member.full_name && p.member_name.trim().toLowerCase() === member.full_name.trim().toLowerCase())
  );

  memPayments.sort((a, b) => {
    const tA = a.paid_at ? new Date(a.paid_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
    const tB = b.paid_at ? new Date(b.paid_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
    return tB - tA;
  });

  if (memPayments.length === 0) {
    const subStart = rawSubEnd !== "--" ? subtractOneMonth(rawSubEnd) : "--";
    return { initialAdmissionDate, subStart, subExpiry: rawSubEnd };
  }

  const latestP = memPayments[0];
  let subStart = "";

  if (latestP.notes) {
    const matchStart = latestP.notes.match(/Start Date:\s*(\d{4}-\d{2}-\d{2})/i);
    if (matchStart && matchStart[1]) {
      subStart = matchStart[1];
    }
  }
  if (!subStart) {
    subStart = latestP.paid_at ? String(latestP.paid_at).substring(0, 10) : "";
  }

  // If expiry date is present in DB, derive subStart if subStart + 1 month != rawSubEnd
  if (rawSubEnd !== "--") {
    if (!subStart || addOneMonth(subStart) !== rawSubEnd) {
      subStart = subtractOneMonth(rawSubEnd);
    }
  }

  const subExpiry = rawSubEnd !== "--" ? rawSubEnd : (subStart ? addOneMonth(subStart) : "--");
  return { initialAdmissionDate, subStart: subStart || "--", subExpiry: subExpiry || "--" };
}


// Generate valid RFC4122 UUIDs for Postgres UUID columns
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Lifetime Permanent Student ID Generator (MSL0001, MSL0002, ...)
export function getNextPermanentId(members = []) {
  let maxNum = 0;
  let combined = Array.isArray(members) ? [...members] : [];

  if (typeof window !== 'undefined') {
    const localMembers = getLocal('mindspace_members', []);
    if (Array.isArray(localMembers) && localMembers.length > 0) {
      combined = [...combined, ...localMembers];
    }
  }

  combined.forEach(m => {
    if (m && m.permanent_id) {
      const match = String(m.permanent_id).match(/(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  return `MSL${String(nextNum).padStart(4, '0')}`;
}

// Local Storage Helper
function getLocal(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocal(key, value) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage write error for ${key}:`, e);
    }
  }
}

// -------------------------------------------------------------
// FRESH COMPREHENSIVE SEED DATA GENERATOR (MSL0001 FORMAT)
// -------------------------------------------------------------

export function seedFreshComprehensiveData() {
  return { freshMembers: [], freshPayments: [], freshExpenses: [], freshLogs: [] };
}

// -------------------------------------------------------------
// REALTIME MULTI-DEVICE CLOUD SYNC SUBSCRIPTION HELPER
// -------------------------------------------------------------

export function subscribeToCloudChanges(onUpdate) {
  if (typeof window === 'undefined') return () => {};

  try {
    const channel = supabase
      .channel('mindspace_realtime_cloud_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Realtime Cloud Event received:', payload);
          if (typeof onUpdate === 'function') {
            onUpdate(payload);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}

// -------------------------------------------------------------
// MEMBER STATUS CALCULATOR
// -------------------------------------------------------------
export function calculateMemberStatus(member) {
  if (!member) return 'INACTIVE';
  if (member.status === 'LEFT' || member.is_active === false || member.left_at) {
    return 'LEFT';
  }
  if (member.is_active) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Promised Due Date Overdue Check (If promised payment date has passed)
    const dueDateStr = member.due_date || member.dues_due_date;
    let isDueDatePassed = false;
    let hasDueDate = false;
    if (dueDateStr) {
      const cleanDueStr = String(dueDateStr).substring(0, 10);
      const dParts = cleanDueStr.split('-').map(Number);
      if (dParts.length === 3 && !isNaN(dParts[0]) && !isNaN(dParts[1]) && !isNaN(dParts[2])) {
        hasDueDate = true;
        const promisedDate = new Date(dParts[0], dParts[1] - 1, dParts[2]);
        promisedDate.setHours(0, 0, 0, 0);
        if (today > promisedDate) {
          isDueDatePassed = true;
          return 'OVERDUE';
        }
      }
    }

    // 2. Subscription Expiry Overdue Check
    const hasValidSub = member.subscription_end_date && !String(member.subscription_end_date).startsWith("1970");
    if (hasValidSub) {
      const cleanSubStr = String(member.subscription_end_date).substring(0, 10);
      const parts = cleanSubStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const endDate = new Date(parts[0], parts[1] - 1, parts[2]);
        endDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return 'OVERDUE';
        }
        if (diffDays <= 3 && diffDays >= 0) {
          return 'DUE_SOON';
        }
      }
    }

    // 3. Unpaid Admission Dues Check (Day 0 = PENDING, Day 1+ = OVERDUE unless due date is set)
    if (member.outstanding_dues > 0) {
      if (!hasValidSub) {
        const joinStr = member.joining_date || (member.created_at ? member.created_at.substring(0, 10) : formatDate(today));
        const jParts = String(joinStr).substring(0, 10).split('-').map(Number);
        if (jParts.length === 3 && !isNaN(jParts[0])) {
          const joinDate = new Date(jParts[0], jParts[1] - 1, jParts[2]);
          joinDate.setHours(0, 0, 0, 0);
          const daysSince = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));

          if (daysSince >= 1 && !hasDueDate) {
            return 'OVERDUE';
          }
        }
      }
      return 'PENDING';
    }

    return 'ACTIVE';
  }
  return 'INACTIVE';
}

// -------------------------------------------------------------
// 15-DAY OVERDUE AUTO SEAT RELEASE ENGINE
// -------------------------------------------------------------
export function checkAndReleaseExpiredSeats(members) {
  const today = new Date();
  let updated = false;

  const newMembers = members.map((m) => {
    if (m.is_active && m.seat_no && m.subscription_end_date && !String(m.subscription_end_date).startsWith("1970")) {
      const endDate = new Date(m.subscription_end_date);
      const diffDays = (today - endDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 15) {
        updated = true;
        return {
          ...m,
          previous_seat_no: m.seat_no,
          seat_no: null,
          status: 'UNRESERVED'
        };
      }
    }
    return m;
  });

  return { newMembers, updated };
}

// -------------------------------------------------------------
// DATA SERVICE METHODS (SUPABASE CLOUD SOURCE OF TRUTH)
// -------------------------------------------------------------

export async function fetchBranches() {
  try {
    const { data, error } = await supabase.from('branches').select('*');
    if (!error && data && data.length > 0) {
      return data.map(b => ({
        ...b,
        total_capacity: (b.code === 'main_branch' || b.code === 'main' || !b.code) ? 113 : (b.total_capacity || 113)
      }));
    }
  } catch (e) {
    console.warn('Supabase fetchBranches error:', e);
  }
  return [
    { id: 'b-1', code: 'main_branch', name: 'Main Branch Library', total_capacity: 113, address: 'Sector 62, Noida' },
    { id: 'b-2', code: 'branch_2', name: 'Sector 18 Executive Branch', total_capacity: 100, address: 'Sector 18, Noida' }
  ];
}

export function sanitizeMemberForSupabase(m) {
  if (!m || typeof m !== 'object') return {};
  const allowedColumns = [
    'id', 'permanent_id', 'student_no', 'full_name', 'father_name', 'mobile',
    'dob', 'gender', 'address', 'aadhar_no', 'targeting_exam', 'shift',
    'seat_no', 'joining_date', 'subscription_end_date', 'plan_amount',
    'outstanding_dues', 'due_date', 'has_locker', 'locker_no', 'locker_fee',
    'is_active', 'status', 'payment_status', 'branch', 'left_at',
    'left_reason', 'left_with_dues', 'loss_amount', 'photo',
    'created_at', 'updated_at'
  ];

  const dateColumns = ['due_date', 'dob', 'joining_date', 'subscription_end_date', 'left_at', 'created_at', 'updated_at'];

  const sanitized = {};
  for (const col of allowedColumns) {
    if (m[col] !== undefined) {
      let val = m[col];
      if (dateColumns.includes(col) && (val === "" || val === null || (typeof val === 'string' && val.trim() === ""))) {
        if (col === 'subscription_end_date') {
          val = '1970-01-01';
        } else {
          val = null;
        }
      }
      sanitized[col] = val;
    }
  }

  if (!sanitized.due_date && m.dues_due_date) {
    const dVal = typeof m.dues_due_date === 'string' ? m.dues_due_date.trim() : m.dues_due_date;
    sanitized.due_date = dVal || null;
  }

  return sanitized;
}

export async function fetchMembers(branch = 'main_branch') {
  let members = [];
  try {
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      members = data;
      setLocal('mindspace_members', data);
    } else if (error) {
      console.error('Supabase fetchMembers error:', error);
      members = getLocal('mindspace_members', []);
    }
  } catch (e) {
    console.error('Supabase fetchMembers exception:', e);
    members = getLocal('mindspace_members', []);
  }

  // Auto-correct plan_amount & dues if locker status or shift plan changed without updating price
  let hasDuesFixed = false;
  members = members.map(m => {
    let pAmt = parseFloat(m.plan_amount || 1100);
    let currDues = parseFloat(m.outstanding_dues || 0);
    let changed = false;

    // If student has NO locker but plan_amount still has +50 locker fee added (e.g. 650 for Half Day or 1150 for Full Day)
    if (!m.has_locker) {
      if (m.shift === "Full Day" && pAmt === 1150) {
        pAmt = 1100;
        changed = true;
      } else if ((m.shift === "Morning" || m.shift === "Evening") && pAmt === 650) {
        pAmt = 600;
        changed = true;
      }
    } else {
      // If student HAS locker but plan_amount is base rate without locker
      if (m.shift === "Full Day" && pAmt === 1100) {
        pAmt = 1150;
        changed = true;
      } else if ((m.shift === "Morning" || m.shift === "Evening") && pAmt === 600) {
        pAmt = 650;
        changed = true;
      }
    }

    if (currDues > pAmt) {
      currDues = pAmt;
      changed = true;
    }

    if (changed) {
      hasDuesFixed = true;
      return { ...m, plan_amount: pAmt, outstanding_dues: currDues };
    }
    return m;
  });

  if (hasDuesFixed) {
    try {
      const sanitizedBatch = members.map(m => sanitizeMemberForSupabase(m));
      await supabase.from('members').upsert(sanitizedBatch);
    } catch (e) {}
  }

  if (!branch || branch === 'ALL' || branch === 'all') {
    return members;
  }

  const branchMembers = members.filter(m => m.branch === branch || !m.branch);
  const { newMembers, updated } = checkAndReleaseExpiredSeats(branchMembers);
  if (updated) {
    try {
      const sanitizedBatch = newMembers.map(m => sanitizeMemberForSupabase(m));
      await supabase.from('members').upsert(sanitizedBatch);
    } catch (e) {}
  }
  return newMembers;
}

export async function createMember(memberData, actor = 'Admin') {
  const newId = memberData.id || generateUUID();
  
  // Ensure permId is non-empty and non-colliding across all branches
  const allMembers = await fetchMembers('ALL');
  let permId = memberData.permanent_id;
  if (!permId || allMembers.some(m => String(m.permanent_id).toUpperCase() === String(permId).toUpperCase())) {
    permId = getNextPermanentId(allMembers);
  }

  const stuNo = memberData.student_no || permId;
  const joinDate = memberData.joining_date || formatDate(new Date());
  const subEndDate = (memberData.subscription_end_date && String(memberData.subscription_end_date).trim() !== "" && !String(memberData.subscription_end_date).startsWith("1970"))
    ? memberData.subscription_end_date
    : '1970-01-01';

  let newMember = {
    id: newId,
    permanent_id: permId,
    student_no: stuNo,
    joining_date: joinDate,
    subscription_end_date: subEndDate,
    plan_amount: parseFloat(memberData.plan_amount || 1100),
    outstanding_dues: parseFloat(memberData.outstanding_dues || 0),
    is_active: memberData.is_active !== undefined ? memberData.is_active : true,
    status: memberData.status || 'ACTIVE',
    payment_status: (parseFloat(memberData.outstanding_dues || 0) > 0) ? 'PARTIAL' : 'PAID',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...memberData,
    permanent_id: permId,
    subscription_end_date: subEndDate
  };

  let sanitizedNewMember = sanitizeMemberForSupabase(newMember);

  try {
    const { error } = await supabase.from('members').insert([sanitizedNewMember]);
    if (error) {
      console.error('Supabase createMember error:', error.message || error);
      // Auto-retry once with next sequential ID if duplicate key constraint failed
      if (error.code === '23505' || String(error.message || '').includes('duplicate key') || String(error.message || '').includes('permanent_id')) {
        const freshAll = await fetchMembers('ALL');
        const retryId = getNextPermanentId(freshAll);
        newMember.permanent_id = retryId;
        newMember.student_no = retryId;
        sanitizedNewMember = sanitizeMemberForSupabase(newMember);
        await supabase.from('members').insert([sanitizedNewMember]);
      }
    }
  } catch (e) {
    console.error('Supabase createMember exception:', e);
  }

  // Backup sync to LocalStorage
  const currentLocal = getLocal('mindspace_members', []);
  const updatedLocal = [newMember, ...currentLocal.filter(m => m.id !== newMember.id)];
  setLocal('mindspace_members', updatedLocal);

  await logActivity({
    branch: memberData.branch || 'main_branch',
    action_type: 'student_admission',
    entity_type: 'member',
    entity_id: newMember.id,
    details: `Admitted new student ${memberData.full_name} (${newMember.permanent_id}) - Shift: ${memberData.shift}, Seat: ${memberData.seat_no || 'Unassigned'}, Locker: ${memberData.has_locker ? (memberData.locker_no || 'Requested') : 'No'}`,
    performed_by: actor,
    after_state: newMember
  });

  return newMember;
}

export async function updateMember(id, updates, actor = 'Admin', beforeMember = null) {
  let beforeState = beforeMember;
  if (!beforeState) {
    try {
      const { data } = await supabase.from('members').select('*').eq('id', id).single();
      if (data) beforeState = data;
    } catch (e) {}
  }

  // Auto-adjust dues if plan_amount or shift has changed and dues equaled the full new plan price or was unadjusted
  if (beforeState && updates.plan_amount !== undefined) {
    const oldPlan = parseFloat(beforeState.plan_amount || 0);
    const newPlan = parseFloat(updates.plan_amount || 0);
    if (oldPlan > 0 && newPlan > 0 && oldPlan !== newPlan) {
      const diff = newPlan - oldPlan;
      const oldDues = parseFloat(beforeState.outstanding_dues || 0);
      if (updates.outstanding_dues === newPlan || updates.outstanding_dues === undefined) {
        updates.outstanding_dues = Math.max(0, oldDues + diff);
      }
      if (updates.payment_status !== 'LEFT') {
        updates.payment_status = (updates.outstanding_dues > 0) ? (updates.outstanding_dues < newPlan ? 'PARTIAL' : 'UNPAID') : 'PAID';
      }
    }
  }

  const updatePayload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const sanitizedUpdates = sanitizeMemberForSupabase(updatePayload);

  let updatedMember = null;
  try {
    const { data, error } = await supabase.from('members').update(sanitizedUpdates).eq('id', id).select('*').single();
    if (error) {
      console.error('Supabase updateMember error:', error);
    } else if (data) {
      updatedMember = data;
    }
  } catch (e) {
    console.error('Supabase updateMember exception:', e);
  }

  if (!updatedMember && beforeState) {
    updatedMember = { ...beforeState, ...updatePayload };
  }

  if (updatedMember) {
    let actionType = 'student_updated';
    let detailMsg = `Updated profile for student ${updatedMember.full_name} (${updatedMember.permanent_id || id})`;

    if (updates.status === 'LEFT' || updates.is_active === false || updates.left_at) {
      actionType = 'student_marked_left';
      detailMsg = `Student ${updatedMember.full_name} marked LEFT. Vacated seat ${beforeState?.seat_no || 'None'}. Loss recorded: ₹${updates.loss_amount || 0}.`;
    } else {
      const changedFields = [];
      if (beforeState) {
        if (updates.full_name && updates.full_name !== beforeState.full_name) changedFields.push(`Name (${beforeState.full_name} → ${updates.full_name})`);
        if (updates.mobile && updates.mobile !== beforeState.mobile) changedFields.push(`Mobile (${beforeState.mobile} → ${updates.mobile})`);
        if (updates.shift && updates.shift !== beforeState.shift) changedFields.push(`Shift (${beforeState.shift} → ${updates.shift})`);
        if (updates.seat_no !== undefined && updates.seat_no !== beforeState.seat_no) changedFields.push(`Seat (${beforeState.seat_no || 'None'} → ${updates.seat_no || 'None'})`);
        if (updates.locker_no !== undefined && updates.locker_no !== beforeState.locker_no) changedFields.push(`Locker (${beforeState.locker_no || 'None'} → ${updates.locker_no || 'None'})`);
        if (updates.subscription_end_date && updates.subscription_end_date !== beforeState.subscription_end_date) changedFields.push(`Expiry (${beforeState.subscription_end_date} → ${updates.subscription_end_date})`);
      }
      if (changedFields.length > 0) {
        detailMsg = `Updated ${updatedMember.full_name} (${updatedMember.permanent_id || id}): ${changedFields.join(', ')}`;
        if (updates.seat_no !== undefined && beforeState && updates.seat_no !== beforeState.seat_no) {
          actionType = updates.seat_no ? 'seat_assigned' : 'seat_vacated';
        } else if (updates.locker_no !== undefined && beforeState && updates.locker_no !== beforeState.locker_no) {
          actionType = updates.locker_no ? 'locker_assigned' : 'locker_vacated';
        } else if (updates.subscription_end_date !== undefined && beforeState && updates.subscription_end_date !== beforeState.subscription_end_date) {
          actionType = 'subscription_extended';
        }
      }
    }

    await logActivity({
      branch: updatedMember.branch || 'main_branch',
      action_type: actionType,
      entity_type: 'member',
      entity_id: id,
      details: detailMsg,
      performed_by: actor,
      before_state: beforeState,
      after_state: updatedMember
    });
  }

  return updatedMember;
}

export async function findMemberByMobileOrId(query, branch = 'main_branch') {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  const members = await fetchMembers(branch);
  return members.find(m => {
    const mob = m.mobile ? String(m.mobile).trim().toLowerCase() : '';
    const permId = m.permanent_id ? String(m.permanent_id).trim().toLowerCase() : '';
    const stuNo = m.student_no ? String(m.student_no).trim().toLowerCase() : '';
    return mob === clean || permId === clean || stuNo === clean;
  }) || null;
}

export async function markMemberLeft(id, { dues_unpaid = false, loss_amount = 0, left_reason = '' }, actor = 'Admin') {
  const members = await fetchMembers();
  const member = members.find(m => m.id === id);
  if (!member) return null;

  const lossVal = dues_unpaid ? parseFloat(loss_amount || 0) : 0;
  const updates = {
    is_active: false,
    status: 'LEFT',
    left_at: new Date().toISOString(),
    left_reason: left_reason || (dues_unpaid ? `Left with unpaid dues ₹${lossVal}` : 'Standard Exit'),
    left_with_dues: dues_unpaid && lossVal > 0,
    loss_amount: lossVal,
    outstanding_dues: 0,
    pay_later: false,
    due_date: null,
    seat_no: null,
    locker_no: null,
    has_locker: false
  };

  return await updateMember(id, updates, actor, member);
}

export async function readmitMember(id, { shift = 'Full Day', seat_no = null, plan_amount = 1100, paid_amount = 1100, payment_mode = 'Cash' }, actor = 'Admin') {
  const members = await fetchMembers();
  const member = members.find(m => m.id === id);
  if (!member) return null;

  const nextMonthStr = formatDate(new Date(Date.now() + 30 * 86400000));
  const planAmt = parseFloat(plan_amount || 1100);
  const paidAmt = parseFloat(paid_amount || 0);
  const duesAmt = Math.max(0, planAmt - paidAmt);

  const updates = {
    is_active: true,
    status: 'ACTIVE',
    shift: shift || member.shift || 'Full Day',
    seat_no: seat_no || null,
    joining_date: formatDate(new Date()),
    subscription_end_date: nextMonthStr,
    plan_amount: planAmt,
    outstanding_dues: duesAmt,
    payment_status: duesAmt === 0 ? 'PAID' : 'PARTIAL',
    left_at: null,
    left_reason: null,
    left_with_dues: false
  };

  const updated = await updateMember(id, updates, actor, member);

  await logActivity({
    branch: member.branch || 'main_branch',
    action_type: 'student_readmission',
    entity_type: 'member',
    entity_id: id,
    details: `Re-admitted student ${member.full_name} (${member.permanent_id || id}) - Shift: ${shift}, Seat: ${seat_no || 'Unassigned'}`,
    performed_by: actor,
    before_state: member,
    after_state: updated
  });

  return updated;
}

export async function deleteMember(id, memberName = 'Student', actor = 'Admin') {
  if (actor === 'Staff' || (typeof window !== 'undefined' && localStorage.getItem('mindspace_user_role') === 'staff')) {
    console.warn('Permanent deletion blocked for Staff role');
    alert("Permission Denied: Staff members cannot delete student records permanently.");
    return false;
  }
  let beforeState = null;
  try {
    const { data } = await supabase.from('members').select('*').eq('id', id).single();
    if (data) beforeState = data;
  } catch (e) {}

  try {
    // 1. Delete member record
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) console.error('Supabase deleteMember error:', error);

    // 2. Purge all associated payment records from Supabase payments table
    await supabase.from('payments').delete().eq('member_id', id);
    if (beforeState) {
      if (beforeState.permanent_id) {
        await supabase.from('payments').delete().eq('member_id', beforeState.permanent_id);
      }
      if (beforeState.full_name) {
        await supabase.from('payments').delete().ilike('member_name', beforeState.full_name.trim());
      }
    }
  } catch (e) {
    console.error('Supabase deleteMember exception:', e);
  }

  await logActivity({
    branch: beforeState ? (beforeState.branch || 'main_branch') : 'main_branch',
    action_type: 'student_deleted',
    entity_type: 'member',
    entity_id: id,
    details: `Permanently deleted student record for ${beforeState ? beforeState.full_name : memberName} (${beforeState ? (beforeState.permanent_id || id) : id})`,
    performed_by: actor,
    before_state: beforeState
  });

  return true;
}

// -------------------------------------------------------------
// PAYMENTS ENGINE & LOSS SETTLEMENT
// -------------------------------------------------------------

export async function fetchPayments(branch = 'main_branch') {
  let payments = [];
  try {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      payments = data;
    }
  } catch (e) {
    console.error('Supabase fetchPayments error:', e);
  }

  payments.sort((a, b) => {
    const timeA = a.paid_at ? new Date(a.paid_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
    const timeB = b.paid_at ? new Date(b.paid_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
    return timeB - timeA;
  });

  if (!branch || branch === 'ALL' || branch === 'all') {
    return payments;
  }

  return payments.filter(p => p.branch === branch || !p.branch);
}

export async function deletePayment(paymentId, actor = 'Admin') {
  let beforeState = null;
  try {
    const { data } = await supabase.from('payments').select('*').eq('id', paymentId).single();
    if (data) beforeState = data;
  } catch (e) {}

  try {
    await supabase.from('payments').delete().eq('id', paymentId);
  } catch (e) {
    console.error('Supabase deletePayment exception:', e);
  }

  if (beforeState && beforeState.member_id) {
    const branch = beforeState.branch || 'main_branch';
    const members = await fetchMembers(branch);
    const member = members.find(m => m.id === beforeState.member_id);

    if (member && member.is_active !== false) {
      // 1. Fetch remaining payments for this member to recalculate subscription expiry & dues
      let remPayments = [];
      try {
        const { data: pData } = await supabase
          .from('payments')
          .select('*')
          .eq('member_id', beforeState.member_id);
        if (pData) remPayments = pData;
      } catch (e) {
        console.error('Error fetching remaining payments:', e);
      }

      // Sort remaining payments chronologically
      remPayments.sort((a, b) => {
        const timeA = a.paid_at ? new Date(a.paid_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
        const timeB = b.paid_at ? new Date(b.paid_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
        return timeA - timeB;
      });

      const deletedAmount = parseFloat(beforeState.amount || 0);
      const currentDues = parseFloat(member.outstanding_dues || 0);
      const planAmt = parseFloat(member.plan_amount || 1100);

      const restoredDues = Math.min(planAmt, currentDues + deletedAmount);

      let newSubEndDate = member.subscription_end_date;

      if (remPayments.length === 0) {
        // No remaining payments: Revert subscription expiry to 1 month from joining date (or today)
        const baseDateStr = member.joining_date ? String(member.joining_date).substring(0, 10) : formatDate(new Date());
        newSubEndDate = addOneMonth(baseDateStr);
      } else {
        // Recalculate subscription_end_date based on the latest valid remaining payment
        const lastPayment = remPayments[remPayments.length - 1];
        const lastPaidStr = lastPayment.paid_at || lastPayment.created_at;
        const baseDateStr = lastPaidStr ? String(lastPaidStr).substring(0, 10) : formatDate(new Date());
        newSubEndDate = addOneMonth(baseDateStr);
      }

      const updates = {
        outstanding_dues: restoredDues,
        subscription_end_date: newSubEndDate
      };

      if (restoredDues >= planAmt) {
        updates.payment_status = 'PAY_LATER';
      } else if (restoredDues > 0) {
        updates.payment_status = 'PARTIAL';
      } else {
        updates.payment_status = 'PAID';
      }

      const tempMemberForStatus = { ...member, ...updates };
      updates.status = calculateMemberStatus(tempMemberForStatus);
      updates.is_active = updates.status !== 'LEFT';

      await updateMember(beforeState.member_id, updates, actor, member);
    }
  }

  await logActivity({
    branch: beforeState ? beforeState.branch : 'main_branch',
    action_type: 'payment_deleted',
    entity_type: 'payment',
    entity_id: paymentId,
    details: `Deleted payment transaction record ID: ${paymentId} (${beforeState ? '₹' + beforeState.amount : ''}) for ${beforeState?.member_name || 'Member'}. Revenue deducted, dues restored, and subscription expiry recalculated.`,
    performed_by: actor,
    before_state: beforeState
  });
}

export async function updatePaymentRecord(paymentId, updateData, actor = 'Admin') {
  if (!paymentId) return null;

  let currentPayment = null;
  try {
    const { data } = await supabase.from('payments').select('*').eq('id', paymentId).single();
    if (data) currentPayment = data;
  } catch (e) {}

  const updates = {};
  if (updateData.paid_at) {
    const pDate = String(updateData.paid_at).substring(0, 10);
    updates.paid_at = pDate.includes('T') ? pDate : `${pDate}T12:00:00.000Z`;
    updates.created_at = updates.paid_at;
  }
  if (updateData.amount !== undefined && updateData.amount !== "") {
    updates.amount = parseFloat(updateData.amount || 0);
  }
  if (updateData.payment_mode) updates.payment_mode = updateData.payment_mode;
  if (updateData.notes !== undefined) updates.notes = updateData.notes;
  if (updateData.member_name) updates.member_name = updateData.member_name;

  try {
    const { error } = await supabase.from('payments').update(updates).eq('id', paymentId);
    if (error) console.error("Supabase updatePaymentRecord error:", error);
  } catch (e) {
    console.error("Supabase updatePaymentRecord exception:", e);
  }

  if (currentPayment && currentPayment.member_id && updateData.paid_at) {
    const members = await fetchMembers(currentPayment.branch || 'main_branch');
    const member = members.find(m => m.id === currentPayment.member_id);
    if (member) {
      const pDate = String(updateData.paid_at).substring(0, 10);
      const newSubEnd = addOneMonth(pDate);
      await updateMember(member.id, {
        subscription_end_date: newSubEnd
      }, actor, member);
    }
  }

  await logActivity({
    branch: currentPayment?.branch || 'main_branch',
    action_type: 'payment_updated',
    entity_type: 'payment',
    entity_id: paymentId,
    details: `Updated payment record ${currentPayment?.invoice_id || paymentId} for ${currentPayment?.member_name || 'Member'}. Date set to: ${updateData.paid_at || 'Unchanged'}, Amount: ₹${updateData.amount || currentPayment?.amount}`,
    performed_by: actor,
    before_state: currentPayment,
    after_state: updates
  });

  return { ...currentPayment, ...updates };
}

export function addDaysToDate(dateStr, daysToAdd = 30) {
  if (!dateStr) return "";
  const str = String(dateStr).substring(0, 10);
  const parts = str.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(daysToAdd || 30));
    return formatDate(d);
  }
  const [y, m, d] = parts;
  const targetDate = new Date(y, m - 1, d);
  targetDate.setDate(targetDate.getDate() + parseInt(daysToAdd || 30));
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function recordPayment({ member_id, member_name, amount, branch = 'main_branch', payment_mode = 'Cash', cash_amount = 0, online_amount = 0, notes = '', is_renewal = false, extend_days = 30, reduce_dues = 0, new_outstanding_dues = null, dues_due_date = null, start_date = null, end_date = null, has_locker = null, paid_at = null, actor = 'Admin' }) {
  const invoice_id = 'INV-' + Date.now().toString().slice(-6);
  const parsedAmt = parseFloat(amount || 0);
  const cAmt = payment_mode === 'Cash' ? parsedAmt : (payment_mode === 'Split' ? parseFloat(cash_amount || 0) : 0);
  const oAmt = (payment_mode === 'Online' || payment_mode === 'UPI') ? parsedAmt : (payment_mode === 'Split' ? parseFloat(online_amount || 0) : 0);

  const txDate = paid_at ? (paid_at.includes('T') ? paid_at : `${paid_at}T12:00:00.000Z`) : new Date().toISOString();
  const paymentDateStr = paid_at ? String(paid_at).substring(0, 10) : formatDate(new Date());
  const subStartStr = start_date || paymentDateStr;

  const calculatedEnd = end_date || addOneMonth(subStartStr);
  const formattedNotes = notes
    ? (notes.includes("Start Date:") ? notes : `${notes} — Start Date: ${subStartStr}, Expiry: ${calculatedEnd}`)
    : `Subscription Payment — Start Date: ${subStartStr}, Expiry: ${calculatedEnd}`;

  const paymentPayload = {
    id: generateUUID(),
    member_id: member_id || null,
    member_name,
    invoice_id,
    amount: parsedAmt,
    branch,
    payment_mode,
    cash_amount: cAmt,
    online_amount: oAmt,
    paid_at: txDate,
    created_at: txDate,
    notes: formattedNotes
  };

  if (member_id) {
    const members = await fetchMembers(branch);
    const member = members.find(m => m.id === member_id);
    if (member) {
      try {
        await supabase.from('members').upsert([sanitizeMemberForSupabase(member)]);
      } catch (e) {}
    }
  }

  try {
    const { error } = await supabase.from('payments').insert([paymentPayload]);
    if (error && (error.message || error.code)) console.error('Supabase recordPayment error:', error.message || error);
  } catch (e) {
    console.error('Supabase recordPayment exception:', e);
  }

  let beforeMemberState = null;
  let afterMemberState = null;

  if (member_id) {
    const members = await fetchMembers(branch);
    const member = members.find(m => m.id === member_id);
    if (member) {
      beforeMemberState = { ...member };
      const updates = {};

      if (has_locker !== null && has_locker !== undefined) {
        updates.has_locker = !!has_locker;
        if (!has_locker) {
          updates.locker_no = null;
        }
      }

      if (end_date && !String(end_date).startsWith("1970")) {
        updates.subscription_end_date = end_date;
      } else {
        updates.subscription_end_date = addOneMonth(subStartStr);
      }

      if (!member.joining_date) {
        updates.joining_date = subStartStr;
      }

      let duesVal;
      if (new_outstanding_dues !== null && new_outstanding_dues !== undefined) {
        duesVal = Math.max(0, parseFloat(new_outstanding_dues));
      } else if (reduce_dues > 0 || member.outstanding_dues > 0) {
        duesVal = Math.max(0, (member.outstanding_dues || 0) - parsedAmt);
      } else {
        duesVal = member.outstanding_dues || 0;
      }

      updates.outstanding_dues = duesVal;

      if (duesVal === 0) {
        updates.payment_status = 'PAID';
        updates.due_date = null;
      } else {
        updates.payment_status = 'PARTIAL';
        if (dues_due_date) {
          updates.due_date = dues_due_date;
        }
      }

      const tempMemberForStatus = { ...member, ...updates };
      updates.status = calculateMemberStatus(tempMemberForStatus);
      updates.is_active = updates.status !== 'LEFT';

      afterMemberState = await updateMember(member_id, updates, actor, beforeMemberState);
    }
  }

  await logActivity({
    branch,
    action_type: 'payment_recorded',
    entity_type: 'payment',
    entity_id: paymentPayload.id,
    details: `Recorded payment of ₹${amount} (${payment_mode}) for ${member_name || 'Member'}. Invoice: ${invoice_id}`,
    performed_by: actor,
    before_state: beforeMemberState,
    after_state: { payment: paymentPayload, member: afterMemberState }
  });

  return paymentPayload;
}

export async function settleLossPayment({ member_id, member_name, amount_paid, payment_mode = 'Cash', reactivate = false, notes = '', branch = 'main_branch', actor = 'Admin' }) {
  const paid = parseFloat(amount_paid);

  const paymentRecord = await recordPayment({
    member_id,
    member_name,
    amount: paid,
    branch,
    payment_mode,
    notes: `Loss Settlement Fee: ${notes}`,
    actor
  });

  const members = await fetchMembers(branch);
  const member = members.find(m => m.id === member_id);

  if (member) {
    const currentLoss = parseFloat(member.loss_amount || 0);
    const remainingLoss = Math.max(0, currentLoss - paid);

    const updates = {
      loss_amount: remainingLoss,
      left_with_dues: remainingLoss > 0
    };

    if (reactivate) {
      updates.is_active = true;
      updates.status = 'ACTIVE';
      updates.left_at = null;
      updates.left_reason = null;
      updates.subscription_end_date = formatDate(new Date(Date.now() + 30 * 86400000));
    }

    await updateMember(member_id, updates, actor, member);
  }

  await logActivity({
    branch,
    action_type: 'loss_settled',
    entity_type: 'member',
    entity_id: member_id,
    details: `Settled loss payment of ₹${paid} for left student ${member_name}. Remaining loss: ₹${member ? Math.max(0, (member.loss_amount || 0) - paid) : 0}`,
    performed_by: actor
  });

  return paymentRecord;
}

// -------------------------------------------------------------
// EXPENSES & PROFIT CALCULATOR
// -------------------------------------------------------------

export async function fetchExpenses(branch = 'main_branch') {
  let expenses = [];
  try {
    const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (!error && Array.isArray(data)) {
      expenses = data;
    }
  } catch (e) {
    console.error('Supabase fetchExpenses error:', e);
  }

  return expenses.filter(e => e.branch === branch || !e.branch);
}

export async function createExpense(expenseData, actor = 'Admin') {
  const newExpense = {
    id: generateUUID(),
    branch: expenseData.branch || 'main_branch',
    title: expenseData.title,
    category: expenseData.category,
    amount: parseFloat(expenseData.amount),
    payment_mode: expenseData.payment_mode || 'Cash',
    expense_date: expenseData.expense_date || formatDate(new Date()),
    notes: expenseData.notes || '',
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('expenses').insert([newExpense]);
    if (error) console.error('Supabase createExpense error:', error);
  } catch (e) {
    console.error('Supabase createExpense exception:', e);
  }

  await logActivity({
    branch: newExpense.branch,
    action_type: 'expense_added',
    entity_type: 'expense',
    entity_id: newExpense.id,
    details: `Added expense: ${newExpense.title} (${newExpense.category}) - ₹${newExpense.amount}`,
    performed_by: actor,
    after_state: newExpense
  });

  return newExpense;
}

export async function deleteExpense(id, actor = 'Admin') {
  let beforeState = null;
  try {
    const { data } = await supabase.from('expenses').select('*').eq('id', id).single();
    if (data) beforeState = data;
  } catch (e) {}

  try {
    await supabase.from('expenses').delete().eq('id', id);
  } catch (e) {
    console.error('Supabase deleteExpense exception:', e);
  }

  await logActivity({
    branch: beforeState ? beforeState.branch : 'main_branch',
    action_type: 'expense_deleted',
    entity_type: 'expense',
    entity_id: id,
    details: `Deleted expense record: ${beforeState ? beforeState.title : id} (₹${beforeState ? beforeState.amount : ''})`,
    performed_by: actor,
    before_state: beforeState
  });
}

export async function deleteAllExpenses(branch = 'main_branch', actor = 'Admin') {
  try {
    await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.error('Supabase deleteAllExpenses exception:', e);
  }

  await logActivity({
    branch,
    action_type: 'expense_deleted',
    entity_type: 'expense',
    details: `Cleared all operational expenses from database ledger`,
    performed_by: actor
  });
}

// -------------------------------------------------------------
// LEADS & WEBSITE ENQUIRIES API
// -------------------------------------------------------------

export async function fetchLeads(branch = 'main_branch') {
  try {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.filter(l => l.branch === branch || !l.branch);
    }
  } catch (e) {
    console.error('Supabase fetchLeads error:', e);
  }
  return [];
}

// -------------------------------------------------------------
// AUDIT TRAILS LOGS
// -------------------------------------------------------------

export async function fetchActivityLogs(branch = 'main_branch') {
  try {
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data
        .filter(l => !l.branch || l.branch === branch)
        .sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
    }
  } catch (e) {
    console.error('Supabase fetchActivityLogs error:', e);
  }
  return [];
}

export async function clearAllActivityLogs() {
  try {
    await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {}
  return [];
}

export async function logActivity({ branch = 'main_branch', action_type, details, performed_by = null, before_state = null, after_state = null, entity_type = null, entity_id = null }) {
  let actor = performed_by;
  if (!actor || actor === 'Admin') {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem("mindspace_user_name");
      const savedRole = localStorage.getItem("mindspace_user_role");
      actor = savedName || (savedRole === 'staff' ? 'Staff' : 'Harsh Goyal (Admin)');
    } else {
      actor = 'Admin';
    }
  }

  const newLog = {
    id: generateUUID(),
    branch: branch || 'main_branch',
    action_type,
    details,
    performed_by: actor,
    created_at: new Date().toISOString()
  };

  try {
    const payload = { ...newLog };
    if (entity_type) payload.entity_type = entity_type;
    if (entity_id) payload.entity_id = String(entity_id);

    const { error } = await supabase.from('activity_logs').insert([payload]);
    if (error) {
      if (String(error.message || '').includes('entity_id') || String(error.message || '').includes('entity_type')) {
        // Retry basic insert without optional entity columns if schema is legacy
        await supabase.from('activity_logs').insert([newLog]);
      } else {
        console.error('Supabase logActivity error:', error);
      }
    }
  } catch (e) {
    console.error('Supabase logActivity exception:', e);
  }

  return newLog;
}

// -------------------------------------------------------------
// SYSTEM SETTINGS & SUPABASE STORAGE UPLOAD HELPERS
// -------------------------------------------------------------

export async function uploadFileToSupabase(file, bucketName = "mindspace-media") {
  if (!file) return null;
  const fileExt = file.name ? file.name.split('.').pop() : 'png';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (!error && data) {
      const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      if (pubData && pubData.publicUrl) {
        return pubData.publicUrl;
      }
    } else if (error) {
      console.warn("Supabase Storage bucket upload error:", error.message || error);
    }
  } catch (e) {
    console.warn("Supabase Storage bucket upload warning, using base64 fallback:", e);
  }

  // Fallback: Read file as base64 Data URL if Supabase bucket isn't initialized yet
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export const DEFAULT_SYSTEM_SETTINGS = {
  heroImage: "/photos/IMG_20260603_202841812_HDR.jpg",
  totalCabins: "113+",
  internetSpeed: "100+ Mbps",
  googleRating: "4.9",
  dailyAccessHours: "15 hrs",
  referenceBooksCount: "5,000+",
  founderName: "Harsh Goyal",
  founderRole: "Founder & Managing Director",
  founderSubrole: "Architect of MindSpace Sanctuary",
  founderPhoto: "/assets/founder_portrait.png",
  founderNoteP1: "MindSpace was born from a singular realization: that brilliance is universal, but high-performance environments are often localized to tier-1 cities.",
  founderNoteP2: "By bringing a premium sanctuary to Ambikapur, we are not just providing desks; we are building a stage where local talent can prepare for global excellence. Every detail, from the acoustics to the lighting, is calibrated to respect the gravity of your ambitions.",
  founderTagline: "Books open mind, MindSpace opens possibilities.",
  deepWorkImage: "/photos/IMG_20260603_202841812_HDR.jpg",
  deepWorkTitle: "Designed for Deep Work",
  deepWorkDesc: "Eliminating the cognitive load of noise, so your brain can achieve the 'Flow' state faster. Every desk is calibrated for zero distraction.",
  galleryImages: [
    { id: "img-1", title: "Main Focus Hall", subtitle: "Spacious & Calibrated Seating", url: "/photos/IMG_20260603_203144883_HDR.jpg" },
    { id: "img-2", title: "Focus Cabin", subtitle: "Silent Individual Workstations", url: "/photos/IMG_20260603_202944240_HDR.jpg" },
    { id: "img-3", title: "Dedicated Desk", subtitle: "Personal Desk Lamp & Outlets", url: "/photos/IMG_20260603_202919449_HDR.jpg" },
    { id: "img-4", title: "Workstation Rows", subtitle: "Ventilated & Air Conditioned", url: "/photos/IMG_20260603_203135772_HDR.jpg" },
    { id: "img-5", title: "Study Sanctuary", subtitle: "Ergonomic Chairs & Wide Desks", url: "/photos/IMG_20260603_202841812_HDR.jpg" },
    { id: "img-6", title: "Personal Storage", subtitle: "Secure Lockers & Quiet Ambiance", url: "/photos/IMG_20260603_203042678_HDR~2.jpg" }
  ],
  adminUsername: "mindspace-01",
  adminPassword: "Harsh@44",
  staffUsername: "staff-01",
  staffPassword: "Staff.01"
};

export function getSystemSettings() {
  return DEFAULT_SYSTEM_SETTINGS;
}

export async function fetchSystemSettingsCloud() {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'default').single();
    if (!error && data && data.content) {
      return data.content;
    }
  } catch (e) {
    console.warn("Supabase fetchSystemSettingsCloud warning:", e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
}

export async function saveSystemSettings(settingsData, actor = 'Admin') {
  let cloudSuccess = false;
  let cloudError = null;

  try {
    const { error } = await supabase.from('site_settings').upsert({
      id: 'default',
      content: settingsData,
      updated_at: new Date().toISOString()
    });

    if (error) {
      cloudError = error.message || JSON.stringify(error);
      console.error("Supabase saveSystemSettings cloud error:", error);
    } else {
      cloudSuccess = true;
    }
  } catch (e) {
    cloudError = e.message || String(e);
    console.error("Supabase saveSystemSettings cloud exception:", e);
  }

  await logActivity({
    branch: "main_branch",
    action_type: "settings_updated",
    details: cloudSuccess 
      ? "Updated visitor website content LIVE on Supabase Cloud (Global Sync OK)" 
      : `Failed to save settings (Cloud Sync Error: ${cloudError})`,
    performed_by: actor,
    after_state: settingsData
  });

  return { success: cloudSuccess, error: cloudError };
}

// -------------------------------------------------------------
// DATABASE ERASE & RE-SEED DATA TOOL
// -------------------------------------------------------------

export async function eraseDatabaseData() {
  try {
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {}

  if (typeof window !== 'undefined') {
    localStorage.clear();
  }

  return {
    freshMembers: [],
    freshPayments: [],
    freshExpenses: [],
    freshLogs: []
  };
}
