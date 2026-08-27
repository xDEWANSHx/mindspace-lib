"use client";

import { fetchSystemSettingsCloud, saveSystemSettings, DEFAULT_SYSTEM_SETTINGS } from "./adminService";

export const DEFAULT_TEMPLATES = {
  welcome: "Dear {student_name},\nWelcome to Mindspace Library! Your seat allocation: {seat_no} ({shift} Shift). Access validity: {expiry_date}. Study hard!",
  receipt: "Dear {student_name},\nPayment received successfully! Amount: ₹{amount} (Mode: {payment_mode}). Invoice: {invoice_id}.\n\n📄 View Online Receipt:\n{invoice_url}\n\nThank you for choosing Mindspace Library!",
  reminder: "Polite Reminder from Mindspace Library: Dear {student_name}, your subscription for Seat {seat_no} is expiring on {expiry_date}. Outstanding Dues: ₹{dues_amount}. Please renew at the earliest.",
  overdue: "URGENT ALERT: Dear {student_name}, your membership subscription has EXPIRED for Seat {seat_no}. Please clear your overdue amount of ₹{dues_amount} to retain your reserved seat.",
  enquiry: "Hello {student_name},\nThank you for inquiring at Mindspace Library! We offer high-speed Wi-Fi, AC quiet study sanctuary, and reserved cabin workstations ({shift} Shift).\nWould you like to schedule a free sanctuary tour?",
  seat_change: "Dear {student_name},\nYour workstation allocation at Mindspace Library has been updated to Seat {seat_no} ({shift} Shift). Locker: {locker_no}. Happy studying!",
  loss_settlement: "Dear {student_name},\nThank you for clearing your outstanding dues of ₹{amount} with Mindspace Library. Your loss settlement receipt has been generated successfully."
};

export function getWhatsAppTemplates() {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const saved = localStorage.getItem("mindspace_whatsapp_templates");
    if (saved) {
      return { ...DEFAULT_TEMPLATES, ...JSON.parse(saved) };
    }
    // Fallback to system settings cache if saved there
    const settingsRaw = localStorage.getItem("mindspace_settings");
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed.waTemplates) {
        return { ...DEFAULT_TEMPLATES, ...parsed.waTemplates };
      }
    }
    return DEFAULT_TEMPLATES;
  } catch (e) {
    return DEFAULT_TEMPLATES;
  }
}

export async function saveWhatsAppTemplates(templates) {
  const merged = { ...DEFAULT_TEMPLATES, ...templates };
  if (typeof window !== "undefined") {
    localStorage.setItem("mindspace_whatsapp_templates", JSON.stringify(merged));
  }
  try {
    const cloudSettings = await fetchSystemSettingsCloud();
    const currentSettings = cloudSettings || DEFAULT_SYSTEM_SETTINGS;
    await saveSystemSettings({
      ...currentSettings,
      waTemplates: merged
    }, "Admin");
  } catch (e) {
    console.error("Failed to sync WhatsApp templates to cloud:", e);
  }
  return merged;
}

export function formatWhatsAppMessage(templateKey, data = {}) {
  const templates = getWhatsAppTemplates();
  let raw = templates[templateKey] || DEFAULT_TEMPLATES[templateKey] || "";
  if (!raw) return "";

  Object.entries(data).forEach(([key, val]) => {
    const valStr = val !== undefined && val !== null && val !== "" ? String(val) : "N/A";
    raw = raw.split(`{${key}}`).join(valStr);
  });

  return raw;
}

export function openWhatsAppDirectMessage(mobile, messageText) {
  if (!mobile) {
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(messageText || "")}`, "_blank");
    }
    return;
  }

  let cleanNumber = String(mobile).replace(/\D/g, "");
  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber;
  }

  const encodedText = encodeURIComponent(messageText || "");
  const url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}

