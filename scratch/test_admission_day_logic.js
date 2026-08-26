import { calculateMemberStatus, recordPayment, createMember, deleteMember, fetchMembers } from "../lib/adminService.js";

async function testAdmissionLogic() {
  console.log("1. Testing calculateMemberStatus for Day 0 admission...");
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Day 0 unpaid student
  const memberDay0 = {
    joining_date: todayStr,
    subscription_end_date: "1970-01-01",
    outstanding_dues: 650,
    is_active: true
  };

  const statusDay0 = calculateMemberStatus(memberDay0);
  console.log("Day 0 Status:", statusDay0);
  if (statusDay0 === 'PENDING') {
    console.log("PASS: Day 0 admission is PENDING!");
  } else {
    console.error("FAIL: Day 0 status should be PENDING, got:", statusDay0);
  }

  // Day 1 unpaid student
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const memberDay1 = {
    joining_date: yesterday,
    subscription_end_date: "1970-01-01",
    outstanding_dues: 650,
    is_active: true
  };

  const statusDay1 = calculateMemberStatus(memberDay1);
  console.log("Day 1 Status:", statusDay1);
  if (statusDay1 === 'OVERDUE') {
    console.log("PASS: Day 1+ unpaid admission is OVERDUE!");
  } else {
    console.error("FAIL: Day 1 status should be OVERDUE, got:", statusDay1);
  }

  console.log("\n2. Testing recordPayment COLLECT_DUES updates subscription_end_date...");
  const newMem = await createMember({
    full_name: "TEST PAYMENT EXPIRY UPDATE",
    mobile: "9999911111",
    joining_date: todayStr,
    subscription_end_date: null,
    plan_amount: 1100,
    outstanding_dues: 1100,
    branch: 'main_branch'
  });

  console.log("Created test student:", newMem.full_name, "subscription_end_date in DB:", newMem.subscription_end_date);

  // Record payment for dues
  await recordPayment({
    member_id: newMem.id,
    member_name: newMem.full_name,
    amount: 1100,
    branch: 'main_branch',
    payment_mode: 'Cash',
    start_date: todayStr,
    end_date: null,
    actor: 'Test'
  });

  const freshMembers = await fetchMembers('main_branch');
  const updatedMem = freshMembers.find(m => m.id === newMem.id);

  console.log("After payment, updated student subscription_end_date in DB:", updatedMem.subscription_end_date);
  console.log("After payment, updated student outstanding_dues:", updatedMem.outstanding_dues);

  if (updatedMem.subscription_end_date && !String(updatedMem.subscription_end_date).startsWith("1970")) {
    console.log("PASS: Payment successfully set valid subscription_end_date in DB!");
  } else {
    console.error("FAIL: subscription_end_date was not updated properly after payment!");
  }

  // Cleanup
  await deleteMember(newMem.id, 'Test Cleanup');
  console.log("Cleaned up test member.");
  process.exit(0);
}

testAdmissionLogic();
