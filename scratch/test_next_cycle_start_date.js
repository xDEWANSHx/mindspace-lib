import { addDaysToDate, addOneMonth } from "../lib/adminService.js";

function testNextCycle() {
  const previousExpiry = "2026-09-23";
  const defaultNextStart = addDaysToDate(previousExpiry, 1);
  const calculatedNextExpiry = addOneMonth(defaultNextStart);

  console.log("Previous Expiry:", previousExpiry);
  console.log("Default Next Cycle Start Date (Next Day):", defaultNextStart);
  console.log("Calculated Next Expiry Date (+1 Month):", calculatedNextExpiry);

  if (defaultNextStart === "2026-09-24" && calculatedNextExpiry === "2026-10-24") {
    console.log("PASS: Next cycle default dates are correctly calculated!");
  } else {
    console.error("FAIL: Incorrect dates calculated!");
  }

  process.exit(0);
}

testNextCycle();
