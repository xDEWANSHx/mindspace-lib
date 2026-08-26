import { supabase } from "../lib/supabase.js";
import { generateUUID } from "../lib/adminService.js";

async function insertTestPhase9() {
  console.log("Inserting/Updating TEST PHASE 9 (MSL0126) with Sub Start = 2026-08-21 and Expiry = 2026-09-21...");

  const memberPayload = {
    id: generateUUID(),
    permanent_id: 'MSL0126',
    student_no: 'MSL0126',
    full_name: 'TEST PHASE 9',
    father_name: 'LSDJKFH',
    mobile: 'WR',
    dob: null,
    gender: 'Male',
    address: 'FDS',
    aadhar_no: 'DFAS',
    targeting_exam: 'UPSC CSE',
    branch: 'main_branch',
    shift: 'Full Day',
    seat_no: null,
    is_active: true,
    status: 'ACTIVE',
    payment_status: 'PAID',
    joining_date: '2026-08-20',
    subscription_end_date: '2026-09-21',
    plan_amount: 1150,
    outstanding_dues: 0,
    has_locker: true,
    locker_no: 'L-Standard'
  };

  const { data: existing } = await supabase.from('members').select('id').eq('permanent_id', 'MSL0126');
  if (existing && existing.length > 0) {
    memberPayload.id = existing[0].id;
    await supabase.from('members').update(memberPayload).eq('id', existing[0].id);
  } else {
    await supabase.from('members').insert([memberPayload]);
  }

  const paymentPayload = {
    id: generateUUID(),
    member_id: memberPayload.id,
    invoice_id: 'INV-174664',
    member_name: 'TEST PHASE 9',
    amount: 1150,
    branch: 'main_branch',
    payment_mode: 'UPI',
    paid_at: '2026-08-21T12:00:00.000Z',
    created_at: '2026-08-21T12:00:00.000Z',
    cash_amount: 0,
    online_amount: 1150,
    notes: 'Recorded on 21/08/2026 — Start Date: 2026-08-21, Expiry: 2026-09-21. Base Plan: ₹1150. Amount Paid: ₹1150.'
  };

  await supabase.from('payments').insert([paymentPayload]);

  console.log("SUCCESSFULLY STORED TEST PHASE 9 (MSL0126) IN SUPABASE!");
  console.log("Initial Admission Date: 2026-08-20");
  console.log("Sub Start: 2026-08-21");
  console.log("Sub Expiry: 2026-09-21");
  console.log("Date Paid: 2026-08-21");
}

insertTestPhase9().catch(console.error);
