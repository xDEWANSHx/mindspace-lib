import { supabase } from './supabase';

// Helper to format date strings YYYY-MM-DD
export function formatDate(date) {
  const d = new Date(date || new Date());
  return d.toISOString().split('T')[0];
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
// FRESH COMPREHENSIVE SEED DATA GENERATOR (ALL 7 SCENARIOS)
// -------------------------------------------------------------

export function seedFreshComprehensiveData() {
  const todayStr = formatDate(new Date());

  const nextMonthStr = formatDate(new Date(Date.now() + 30 * 86400000));
  const dueSoonStr = formatDate(new Date(Date.now() + 2 * 86400000)); // 2 days away -> DUE_SOON
  const overdue5DaysStr = formatDate(new Date(Date.now() - 5 * 86400000)); // 5 days ago -> OVERDUE
  const overdue20DaysStr = formatDate(new Date(Date.now() - 21 * 86400000)); // 21 days ago -> UNRESERVED
  const leftDateStr = new Date(Date.now() - 10 * 86400000).toISOString();

  const freshMembers = [
    // 1. Scenario: Active Member with Full Fees Paid & Locker Allocated
    {
      id: "m-101",
      permanent_id: "MS-2026-001",
      student_no: "STU-1001",
      full_name: "Ankit Sharma",
      father_name: "Ramesh Sharma",
      mobile: "9876543210",
      dob: "2002-05-12",
      gender: "Male",
      address: "Sector 62, Noida",
      aadhar_no: "123456789012",
      targeting_exam: "UPSC Civil Services",
      branch: "main_branch",
      shift: "Full Day",
      seat_no: "SEAT-001",
      has_locker: true,
      locker_no: "LOCKER-001",
      is_active: true,
      status: "ACTIVE",
      payment_status: "PAID",
      joining_date: "2026-08-01",
      subscription_end_date: nextMonthStr,
      plan_amount: 1200,
      outstanding_dues: 0,
      pay_later: false,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString()
    },
    // 2. Scenario: New Admission with Pending Fees / Outstanding Dues & Locker Requested
    {
      id: "m-102",
      permanent_id: "MS-2026-002",
      student_no: "STU-1002",
      full_name: "Priya Singh",
      father_name: "Vikram Singh",
      mobile: "9123456789",
      dob: "2003-08-20",
      gender: "Female",
      address: "Indirapuram, Ghaziabad",
      aadhar_no: "987654321098",
      targeting_exam: "NEET PG",
      branch: "main_branch",
      shift: "Morning",
      seat_no: "SEAT-005",
      has_locker: true,
      locker_no: null, // Requested, waiting for allocation!
      is_active: true,
      status: "ACTIVE",
      payment_status: "PARTIAL",
      joining_date: "2026-08-01",
      subscription_end_date: nextMonthStr,
      plan_amount: 1000,
      outstanding_dues: 600,
      pay_later: true,
      due_date: "2026-08-15",
      created_at: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    // 3. Scenario: Fees Due Soon (Expiring in 2 Days)
    {
      id: "m-103",
      permanent_id: "MS-2026-003",
      student_no: "STU-1003",
      full_name: "Rohan Verma",
      father_name: "Sunil Verma",
      mobile: "9988776655",
      dob: "2001-11-15",
      gender: "Male",
      address: "Sector 18, Noida",
      aadhar_no: "456789012345",
      targeting_exam: "GATE Computer Science",
      branch: "main_branch",
      shift: "Evening",
      seat_no: "SEAT-012",
      has_locker: false,
      locker_no: null,
      is_active: true,
      status: "ACTIVE",
      payment_status: "PAID",
      joining_date: "2026-07-10",
      subscription_end_date: dueSoonStr,
      plan_amount: 1000,
      outstanding_dues: 0,
      pay_later: false,
      created_at: new Date(Date.now() - 28 * 86400000).toISOString()
    },
    // 4. Scenario: Overdue Member (Subscription expired 5 days ago)
    {
      id: "m-104",
      permanent_id: "MS-2026-004",
      student_no: "STU-1004",
      full_name: "Vikash Kumar",
      father_name: "Mahesh Kumar",
      mobile: "9811223344",
      dob: "2000-03-04",
      gender: "Male",
      address: "Sector 63, Noida",
      aadhar_no: "567890123456",
      targeting_exam: "SSC CGL",
      branch: "main_branch",
      shift: "Full Day",
      seat_no: "SEAT-022",
      has_locker: true,
      locker_no: "LOCKER-005",
      is_active: true,
      status: "ACTIVE",
      payment_status: "PAID",
      joining_date: "2026-07-03",
      subscription_end_date: overdue5DaysStr,
      plan_amount: 1200,
      outstanding_dues: 0,
      pay_later: false,
      created_at: new Date(Date.now() - 35 * 86400000).toISOString()
    },
    // 5. Scenario: Overdue >15 Days (Seat auto-released, status UNRESERVED)
    {
      id: "m-105",
      permanent_id: "MS-2026-005",
      student_no: "STU-1005",
      full_name: "Neha Gupta",
      father_name: "Pankaj Gupta",
      mobile: "9765432109",
      dob: "2003-01-25",
      gender: "Female",
      address: "Noida Extension",
      aadhar_no: "678901234567",
      targeting_exam: "CA Final",
      branch: "main_branch",
      shift: "Morning",
      seat_no: null,
      previous_seat_no: "SEAT-045",
      has_locker: false,
      locker_no: null,
      is_active: true,
      status: "UNRESERVED",
      payment_status: "PAID",
      joining_date: "2026-06-18",
      subscription_end_date: overdue20DaysStr,
      plan_amount: 1000,
      outstanding_dues: 0,
      pay_later: false,
      created_at: new Date(Date.now() - 50 * 86400000).toISOString()
    },
    // 6. Scenario: Left Member with Outstanding Defaulter Loss
    {
      id: "m-106",
      permanent_id: "MS-2026-006",
      student_no: "STU-1006",
      full_name: "Amit Patel",
      father_name: "Suresh Patel",
      mobile: "9654321098",
      dob: "1999-09-09",
      gender: "Male",
      address: "Sector 55, Noida",
      aadhar_no: "789012345678",
      targeting_exam: "UPSC Engineering Services",
      branch: "main_branch",
      shift: "Full Day",
      seat_no: null,
      has_locker: false,
      locker_no: null,
      is_active: false,
      status: "LEFT",
      payment_status: "UNPAID",
      joining_date: "2026-06-01",
      subscription_end_date: "2026-07-20",
      left_at: leftDateStr,
      left_reason: "Left without paying final month fee",
      left_with_dues: true,
      loss_amount: 1500,
      plan_amount: 1200,
      outstanding_dues: 1500,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    // 7. Scenario: Today's New Admission with Full Cash Payment
    {
      id: "m-107",
      permanent_id: "MS-2026-007",
      student_no: "STU-1007",
      full_name: "Aakash Tiwari",
      father_name: "Deepak Tiwari",
      mobile: "9543210987",
      dob: "2002-12-01",
      gender: "Male",
      address: "Sector 62, Noida",
      aadhar_no: "890123456789",
      targeting_exam: "CAT 2026",
      branch: "main_branch",
      shift: "Full Day",
      seat_no: "SEAT-089",
      has_locker: false,
      locker_no: null,
      is_active: true,
      status: "ACTIVE",
      payment_status: "PAID",
      joining_date: todayStr,
      subscription_end_date: nextMonthStr,
      plan_amount: 1200,
      outstanding_dues: 0,
      pay_later: false,
      created_at: new Date().toISOString()
    }
  ];

  const freshPayments = [
    {
      id: "p-101",
      member_id: "m-101",
      invoice_id: "INV-001001",
      member_name: "Ankit Sharma",
      amount: 1200,
      branch: "main_branch",
      payment_mode: "Online",
      cash_amount: 0,
      online_amount: 1200,
      paid_at: "2026-08-01T10:30:00.000Z",
      created_at: "2026-08-01T10:30:00.000Z",
      notes: "Full Day Plan August Renewal"
    },
    {
      id: "p-102",
      member_id: "m-102",
      invoice_id: "INV-001002",
      member_name: "Priya Singh",
      amount: 400,
      branch: "main_branch",
      payment_mode: "UPI",
      cash_amount: 0,
      online_amount: 400,
      paid_at: "2026-08-01T11:45:00.000Z",
      created_at: "2026-08-01T11:45:00.000Z",
      notes: "Partial admission payment. Remaining ₹600 pending"
    },
    {
      id: "p-103",
      member_id: "m-103",
      invoice_id: "INV-001003",
      member_name: "Rohan Verma",
      amount: 1000,
      branch: "main_branch",
      payment_mode: "Cash",
      cash_amount: 1000,
      online_amount: 0,
      paid_at: "2026-07-10T14:20:00.000Z",
      created_at: "2026-07-10T14:20:00.000Z",
      notes: "Evening Shift Monthly Plan"
    },
    {
      id: "p-104",
      member_id: "m-104",
      invoice_id: "INV-001004",
      member_name: "Vikash Kumar",
      amount: 1200,
      branch: "main_branch",
      payment_mode: "Online",
      cash_amount: 0,
      online_amount: 1200,
      paid_at: "2026-07-03T09:15:00.000Z",
      created_at: "2026-07-03T09:15:00.000Z",
      notes: "Full Day Access July"
    },
    {
      id: "p-105",
      member_id: "m-107",
      invoice_id: "INV-001005",
      member_name: "Aakash Tiwari",
      amount: 1200,
      branch: "main_branch",
      payment_mode: "Cash",
      cash_amount: 1200,
      online_amount: 0,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      notes: "New Admission Full Day Plan (Today)"
    }
  ];

  const freshExpenses = [
    {
      id: "e-101",
      branch: "main_branch",
      title: "Commercial High-Speed WiFi Fiber Bill",
      category: "WiFi",
      amount: 2500,
      payment_mode: "Online",
      expense_date: "2026-08-02",
      notes: "Monthly 300 Mbps Airtel Fiber",
      created_at: "2026-08-02T10:00:00.000Z"
    },
    {
      id: "e-102",
      branch: "main_branch",
      title: "Commercial Electricity & Central AC Bill",
      category: "Electricity",
      amount: 8500,
      payment_mode: "Online",
      expense_date: "2026-08-05",
      notes: "Electricity power bill July-August",
      created_at: "2026-08-05T12:00:00.000Z"
    },
    {
      id: "e-103",
      branch: "main_branch",
      title: "Staff Desk & Daily Sanitization Salary",
      category: "Salary",
      amount: 3000,
      payment_mode: "Cash",
      expense_date: "2026-08-07",
      notes: "Helper salary advance",
      created_at: "2026-08-07T16:00:00.000Z"
    }
  ];

  const freshLogs = [
    {
      id: "l-101",
      branch: "main_branch",
      action_type: "student_admission",
      entity_type: "member",
      entity_id: "m-107",
      details: "Admitted new student Aakash Tiwari (MS-2026-007) - Shift: Full Day, Seat: SEAT-089",
      performed_by: "Admin",
      created_at: new Date().toISOString()
    },
    {
      id: "l-102",
      branch: "main_branch",
      action_type: "payment_recorded",
      entity_type: "payment",
      entity_id: "p-105",
      details: "Recorded payment of ₹1200 (Cash) for Aakash Tiwari. Invoice: INV-001005",
      performed_by: "Admin",
      created_at: new Date().toISOString()
    },
    {
      id: "l-103",
      branch: "main_branch",
      action_type: "student_marked_left",
      entity_type: "member",
      entity_id: "m-106",
      details: "Student Amit Patel marked left with dues of ₹1500",
      performed_by: "Admin",
      created_at: leftDateStr
    }
  ];

  const freshLeads = [
    {
      id: "lead-101",
      full_name: "Deepak Mishra",
      phone: "9432109876",
      interest: "Full Day",
      status: "new",
      branch: "main_branch",
      notes: "Inquired about 24x7 night access & quiet cubicles.",
      created_at: new Date().toISOString()
    },
    {
      id: "lead-102",
      full_name: "Kavita Roy",
      phone: "9321098765",
      interest: "Morning",
      status: "contacted",
      branch: "main_branch",
      notes: "Preparing for Banking exams. Scheduled tour tomorrow at 11 AM.",
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  setLocal("mindspace_members", freshMembers);
  setLocal("mindspace_payments", freshPayments);
  setLocal("mindspace_expenses", freshExpenses);
  setLocal("mindspace_logs", freshLogs);
  setLocal("mindspace_leads", freshLeads);
  setLocal("mindspace_seed_version", "2.0");

  // Sync fresh seed data to Supabase in background
  try {
    supabase.from('members').upsert(freshMembers);
    supabase.from('payments').upsert(freshPayments);
    supabase.from('expenses').upsert(freshExpenses);
    supabase.from('activity_logs').upsert(freshLogs);
  } catch (e) {}

  return { freshMembers, freshPayments, freshExpenses, freshLogs, freshLeads };
}

// -------------------------------------------------------------
// MEMBER STATUS CALCULATOR ENGINE
// -------------------------------------------------------------
export function calculateMemberStatus(member) {
  if (member.status === 'LEFT' || member.left_at) {
    return 'LEFT';
  }
  if (member.is_active) {
    const today = new Date();
    const endDate = new Date(member.subscription_end_date);
    const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'OVERDUE';
    }
    if (member.outstanding_dues > 0) {
      return 'PENDING';
    }
    if (diffDays <= 3) {
      return 'DUE_SOON';
    }
    if (!member.seat_no) {
      return 'UNRESERVED';
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
    if (m.is_active && m.seat_no && m.subscription_end_date) {
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
// DATA SERVICE METHODS (STRICT SINGLE SOURCE OF TRUTH)
// -------------------------------------------------------------

export async function fetchBranches() {
  try {
    const { data, error } = await supabase.from('branches').select('*');
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    console.warn('Supabase fetchBranches error:', e);
  }
  return [
    { id: 'b-1', code: 'main_branch', name: 'Main Branch Library', total_capacity: 150, address: 'Sector 62, Noida' },
    { id: 'b-2', code: 'branch_2', name: 'Sector 18 Executive Branch', total_capacity: 100, address: 'Sector 18, Noida' }
  ];
}

export async function fetchMembers(branch = 'main_branch') {
  let localList = getLocal('mindspace_members', []);
  let seedVer = getLocal('mindspace_seed_version', null);
  
  // Detect if old test data (KLB- format) exists in browser localStorage or version outdated
  const hasOldData = localList && localList.some(m => m.permanent_id && m.permanent_id.startsWith('KLB-'));
  if (seedVer !== '2.0' || hasOldData || !localList || localList.length === 0) {
    const seeded = seedFreshComprehensiveData();
    localList = seeded.freshMembers;
  }

  const branchMembers = localList.filter(m => m.branch === branch || !m.branch);
  const { newMembers } = checkAndReleaseExpiredSeats(branchMembers);
  return newMembers;
}

export async function createMember(memberData, actor = 'Admin') {
  const newId = 'm-' + Date.now();
  const newMember = {
    id: newId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    status: 'ACTIVE',
    payment_status: memberData.outstanding_dues > 0 ? 'PARTIAL' : 'PAID',
    ...memberData
  };

  const localM = getLocal('mindspace_members', []);
  const updatedLocal = [newMember, ...localM];
  setLocal('mindspace_members', updatedLocal);

  await logActivity({
    branch: memberData.branch || 'main_branch',
    action_type: 'student_admission',
    entity_type: 'member',
    entity_id: newMember.id,
    details: `Admitted new student ${memberData.full_name} (${memberData.permanent_id || newMember.id}) - Shift: ${memberData.shift}, Seat: ${memberData.seat_no || 'Unassigned'}, Locker: ${memberData.has_locker ? (memberData.locker_no || 'Requested') : 'No'}`,
    performed_by: actor,
    after_state: newMember
  });

  try {
    await supabase.from('members').insert([newMember]);
  } catch (e) {}

  return newMember;
}

export async function updateMember(id, updates, actor = 'Admin', beforeMember = null) {
  const localM = getLocal('mindspace_members', []);
  let beforeState = beforeMember || localM.find(m => m.id === id) || null;

  let updatedLocalMember = null;
  const newLocal = localM.map(m => {
    if (m.id === id) {
      updatedLocalMember = { ...m, ...updates, updated_at: new Date().toISOString() };
      return updatedLocalMember;
    }
    return m;
  });

  if (!updatedLocalMember && beforeState) {
    updatedLocalMember = { ...beforeState, ...updates, updated_at: new Date().toISOString() };
    newLocal.unshift(updatedLocalMember);
  }

  setLocal('mindspace_members', newLocal);

  if (updatedLocalMember) {
    await logActivity({
      branch: updatedLocalMember.branch || 'main_branch',
      action_type: 'student_updated',
      entity_type: 'member',
      entity_id: id,
      details: `Updated details for student ${updatedLocalMember.full_name} (${updatedLocalMember.permanent_id || id})`,
      performed_by: actor,
      before_state: beforeState,
      after_state: updatedLocalMember
    });
  }

  try {
    await supabase.from('members').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  } catch (e) {}

  return updatedLocalMember;
}

export async function deleteMember(id, memberName = 'Student', actor = 'Admin') {
  const localM = getLocal('mindspace_members', []);
  const beforeState = localM.find(m => m.id === id) || null;

  // Immediately remove from LocalStorage
  const remaining = localM.filter(m => m.id !== id);
  setLocal('mindspace_members', remaining);

  const localP = getLocal('mindspace_payments', []);
  setLocal('mindspace_payments', localP.filter(p => p.member_id !== id));

  await logActivity({
    branch: beforeState ? beforeState.branch : 'main_branch',
    action_type: 'student_deleted',
    entity_type: 'member',
    entity_id: id,
    details: `Deleted student record & payments for ${memberName} (ID: ${id})`,
    performed_by: actor,
    before_state: beforeState
  });

  try {
    await supabase.from('payments').delete().eq('member_id', id);
    await supabase.from('members').delete().eq('id', id);
  } catch (e) {}
}

// -------------------------------------------------------------
// PAYMENTS ENGINE & LOSS SETTLEMENT
// -------------------------------------------------------------

export async function fetchPayments(branch = 'main_branch') {
  let localP = getLocal('mindspace_payments', []);
  if (!localP || localP.length === 0) {
    const seeded = seedFreshComprehensiveData();
    localP = seeded.freshPayments;
  }
  return localP.filter(p => p.branch === branch || !p.branch);
}

export async function deletePayment(paymentId, actor = 'Admin') {
  const localP = getLocal('mindspace_payments', []);
  const beforeState = localP.find(p => p.id === paymentId) || null;

  setLocal('mindspace_payments', localP.filter(p => p.id !== paymentId));

  await logActivity({
    branch: beforeState ? beforeState.branch : 'main_branch',
    action_type: 'payment_deleted',
    entity_type: 'payment',
    entity_id: paymentId,
    details: `Deleted payment transaction record ID: ${paymentId} (${beforeState ? '₹' + beforeState.amount : ''})`,
    performed_by: actor,
    before_state: beforeState
  });

  try {
    await supabase.from('payments').delete().eq('id', paymentId);
  } catch (e) {}
}

export async function recordPayment({ member_id, member_name, amount, branch = 'main_branch', payment_mode = 'Cash', cash_amount = 0, online_amount = 0, notes = '', is_renewal = false, extend_days = 30, reduce_dues = 0, new_outstanding_dues = null, actor = 'Admin' }) {
  const invoice_id = 'INV-' + Date.now().toString().slice(-6);
  const parsedAmt = parseFloat(amount || 0);
  const cAmt = payment_mode === 'Cash' ? parsedAmt : (payment_mode === 'Split' ? parseFloat(cash_amount || 0) : 0);
  const oAmt = (payment_mode === 'Online' || payment_mode === 'UPI') ? parsedAmt : (payment_mode === 'Split' ? parseFloat(online_amount || 0) : 0);

  const paymentPayload = {
    id: 'p-' + Date.now(),
    member_id: member_id || null,
    member_name,
    invoice_id,
    amount: parsedAmt,
    branch,
    payment_mode,
    cash_amount: cAmt,
    online_amount: oAmt,
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    notes
  };

  const allPayments = getLocal('mindspace_payments', []);
  setLocal('mindspace_payments', [paymentPayload, ...allPayments]);

  let beforeMemberState = null;
  let afterMemberState = null;

  if (member_id) {
    const members = await fetchMembers(branch);
    const member = members.find(m => m.id === member_id);
    if (member) {
      beforeMemberState = { ...member };
      const updates = {};
      if (is_renewal) {
        const currEnd = new Date(member.subscription_end_date > formatDate(new Date()) ? member.subscription_end_date : new Date());
        currEnd.setDate(currEnd.getDate() + parseInt(extend_days));
        updates.subscription_end_date = formatDate(currEnd);
        updates.payment_status = 'PAID';
        updates.status = 'ACTIVE';
        updates.is_active = true;
      }
      if (new_outstanding_dues !== null && new_outstanding_dues !== undefined) {
        updates.outstanding_dues = Math.max(0, parseFloat(new_outstanding_dues));
        if (updates.outstanding_dues === 0) {
          updates.payment_status = 'PAID';
        } else {
          updates.payment_status = 'PARTIAL';
        }
      } else if (reduce_dues > 0 || member.outstanding_dues > 0) {
        const remainingDues = Math.max(0, (member.outstanding_dues || 0) - parsedAmt);
        updates.outstanding_dues = remainingDues;
        if (remainingDues === 0) {
          updates.payment_status = 'PAID';
        }
      }
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

  try {
    await supabase.from('payments').insert([paymentPayload]);
  } catch (e) {}

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
  let localE = getLocal('mindspace_expenses', []);
  if (!localE || localE.length === 0) {
    const seeded = seedFreshComprehensiveData();
    localE = seeded.freshExpenses;
  }
  return localE.filter(e => e.branch === branch || !e.branch);
}

export async function createExpense(expenseData, actor = 'Admin') {
  const newExpense = {
    id: 'e-' + Date.now(),
    branch: expenseData.branch || 'main_branch',
    title: expenseData.title,
    category: expenseData.category,
    amount: parseFloat(expenseData.amount),
    payment_mode: expenseData.payment_mode || 'Cash',
    expense_date: expenseData.expense_date || formatDate(new Date()),
    notes: expenseData.notes || '',
    created_at: new Date().toISOString()
  };

  const allLocal = getLocal('mindspace_expenses', []);
  setLocal('mindspace_expenses', [newExpense, ...allLocal]);

  await logActivity({
    branch: newExpense.branch,
    action_type: 'expense_added',
    entity_type: 'expense',
    entity_id: newExpense.id,
    details: `Added expense: ${newExpense.title} (${newExpense.category}) - ₹${newExpense.amount}`,
    performed_by: actor,
    after_state: newExpense
  });

  try {
    await supabase.from('expenses').insert([newExpense]);
  } catch (e) {}

  return newExpense;
}

export async function deleteExpense(id, actor = 'Admin') {
  const allLocal = getLocal('mindspace_expenses', []);
  const beforeState = allLocal.find(e => e.id === id) || null;

  setLocal('mindspace_expenses', allLocal.filter(e => e.id !== id));

  await logActivity({
    branch: beforeState ? beforeState.branch : 'main_branch',
    action_type: 'expense_deleted',
    entity_type: 'expense',
    entity_id: id,
    details: `Deleted expense record: ${beforeState ? beforeState.title : id} (₹${beforeState ? beforeState.amount : ''})`,
    performed_by: actor,
    before_state: beforeState
  });

  try {
    await supabase.from('expenses').delete().eq('id', id);
  } catch (e) {}
}

// -------------------------------------------------------------
// AUDIT TRAILS LOGS
// -------------------------------------------------------------

export async function fetchActivityLogs(branch = 'main_branch') {
  let localL = getLocal('mindspace_logs', []);
  if (!localL || localL.length === 0) {
    const seeded = seedFreshComprehensiveData();
    localL = seeded.freshLogs;
  }
  return localL;
}

export async function logActivity({ branch = 'main_branch', action_type, details, performed_by = 'Admin', before_state = null, after_state = null, entity_type = null, entity_id = null }) {
  const newLog = {
    id: 'l-' + Date.now(),
    branch,
    action_type,
    details,
    performed_by,
    entity_type,
    entity_id,
    before_state: before_state ? (typeof before_state === 'object' ? JSON.stringify(before_state) : before_state) : null,
    after_state: after_state ? (typeof after_state === 'object' ? JSON.stringify(after_state) : after_state) : null,
    created_at: new Date().toISOString()
  };

  const allLogs = getLocal('mindspace_logs', []);
  setLocal('mindspace_logs', [newLog, ...allLogs]);

  try {
    await supabase.from('activity_logs').insert([newLog]);
  } catch (e) {}

  return newLog;
}

// -------------------------------------------------------------
// SYSTEM SETTINGS HELPERS (GALLERY, FOUNDER NOTE, PASSWORD)
// -------------------------------------------------------------

export function getSystemSettings() {
  const fallback = {
    galleryImages: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80", title: "Quiet Sanctuary Workspace" },
      { id: "img-2", url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80", title: "Individual Study Cubicles" }
    ],
    founderNote: "Our mission is to empower students with world-class, quiet, air-conditioned study environments equipped with high-speed internet and ergonomic seating.",
    founderPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    adminPassword: "admin",
    staffPassword: "staff"
  };
  return getLocal("mindspace_settings", fallback);
}

export function saveSystemSettings(settingsData, actor = 'Admin') {
  setLocal("mindspace_settings", settingsData);
  logActivity({
    branch: "main_branch",
    action_type: "settings_updated",
    details: "Updated system settings (Gallery photos, Founder Note, or Security Passwords)",
    performed_by: actor,
    after_state: settingsData
  });
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

  // Instantly re-seed fresh comprehensive scenario data!
  return seedFreshComprehensiveData();
}
