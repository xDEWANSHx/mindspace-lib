"use client";

const DEFAULT_TEMPLATES = {
  welcome: "Dear {student_name},\nWelcome to Mindspace Library! Your seat allocation: {seat_no} ({shift} Shift). Access validity: {expiry_date}. Study hard!",
  receipt: "Dear {student_name},\nPayment received successfully! Amount: ₹{amount} (Mode: {payment_mode}). Invoice: {invoice_id}. Thank you for choosing Mindspace Library!",
  reminder: "Polite Reminder from Mindspace Library: Dear {student_name}, your subscription for Seat {seat_no} is expiring on {expiry_date}. Outstanding Dues: ₹{dues_amount}. Please renew at the earliest.",
  overdue: "URGENT ALERT: Dear {student_name}, your membership subscription has EXPIRED for Seat {seat_no}. Please clear your overdue amount of ₹{dues_amount} to retain your reserved seat."
};

export function getWhatsAppTemplates() {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const saved = localStorage.getItem("mindspace_whatsapp_templates");
    return saved ? { ...DEFAULT_TEMPLATES, ...JSON.parse(saved) } : DEFAULT_TEMPLATES;
  } catch (e) {
    return DEFAULT_TEMPLATES;
  }
}

export function saveWhatsAppTemplates(templates) {
  if (typeof window !== "undefined") {
    localStorage.setItem("mindspace_whatsapp_templates", JSON.stringify(templates));
  }
}

export function formatWhatsAppMessage(templateKey, data = {}) {
  const templates = getWhatsAppTemplates();
  let raw = templates[templateKey] || DEFAULT_TEMPLATES[templateKey] || "";

  Object.entries(data).forEach(([key, val]) => {
    raw = raw.replaceAll(`{${key}}`, val ?? "N/A");
  });

  return raw;
}
