import { createMember, getMemberSubscriptionDates, fetchMembers, deleteMember } from "../lib/adminService.js";

async function testUnpaidAdmission() {
  console.log("Creating test unpaid student...");
  const testPayload = {
    full_name: "TEST ADMISSION DATE VERIFY",
    mobile: "9999988888",
    joining_date: "2026-08-20",
    subscription_end_date: null,
    plan_amount: 1150,
    outstanding_dues: 1150,
    payment_status: 'PAY_LATER',
    branch: 'main_branch'
  };

  const newMem = await createMember(testPayload);
  console.log("Created student ID:", newMem.permanent_id, "joining_date:", newMem.joining_date, "subscription_end_date:", newMem.subscription_end_date);

  const dates = getMemberSubscriptionDates(newMem, []);
  console.log("getMemberSubscriptionDates output:", dates);

  if (dates.subExpiry === "--" && dates.subStart === "--" && dates.initialAdmissionDate === "2026-08-20") {
    console.log("SUCCESS! Unpaid student initial admission date is preserved and expiry is '--'!");
  } else {
    console.error("FAIL! Incorrect dates:", dates);
  }

  // Clean up test member
  if (newMem && newMem.id) {
    await deleteMember(newMem.id, "System Test");
    console.log("Cleaned up test member.");
  }

  process.exit(0);
}

testUnpaidAdmission();
