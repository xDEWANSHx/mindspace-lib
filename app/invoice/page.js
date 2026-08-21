"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchPayments, fetchMembers, formatDate } from "@/lib/adminService";
import { Printer, Download, Share2, ArrowLeft, ShieldCheck, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function InvoicePrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");

  const [payment, setPayment] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pList, mList] = await Promise.all([
        fetchPayments("main_branch"),
        fetchMembers("main_branch")
      ]);

      let foundPayment = null;
      if (invoiceId) {
        foundPayment = pList.find(p => p.invoice_id === invoiceId || p.id === invoiceId);
      }
      if (!foundPayment && pList.length > 0) {
        foundPayment = pList[0];
      }

      if (foundPayment) {
        setPayment(foundPayment);
        const foundMem = mList.find(m => m.id === foundPayment.member_id || m.full_name === foundPayment.member_name);
        setMember(foundMem || null);
      }
      setLoading(false);
    }
    load();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-200 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-800/80 px-6 py-4 rounded-xl border border-slate-700 shadow-xl">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Generating Official A4 Fee Receipt...</span>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-200 flex items-center justify-center p-4 font-sans">
        <div className="text-center space-y-4 max-w-md bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <p className="text-base font-semibold text-slate-300">Invoice Record Not Found</p>
          <p className="text-xs text-slate-400">The requested invoice ID could not be loaded from database records.</p>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Invoices Ledger</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculated variables for reference template matching
  const receiptNo = payment.invoice_id || `REC-B-${Date.now().toString().slice(-5)}`;
  
  // Formatted dates
  const rawPaidAt = payment.paid_at || payment.created_at;
  const receiptDate = rawPaidAt ? rawPaidAt.substring(0, 10).split('-').reverse().join('/') : formatDate(new Date()).split('-').reverse().join('/');
  
  const studentAllotmentNo = member?.permanent_id || `#MS26B${Date.now().toString().slice(-2)}`;
  const studentName = (payment.member_name || member?.full_name || "STUDENT").toUpperCase();
  const libraryId = member?.student_no || member?.permanent_id || "MSB154";
  const mobileNo = member?.mobile || "";
  const shiftName = member?.shift || "Full Day";
  const seatNo = member?.seat_no || "Unassigned";
  const joiningDate = member?.joining_date ? member.joining_date.split('-').reverse().join('/') : receiptDate;
  const endDate = member?.subscription_end_date ? member.subscription_end_date.split('-').reverse().join('/') : "N/A";

  // Subscription Start = 1 month before subscription_end_date (current billing cycle start)
  let subscriptionStartDate = joiningDate;
  if (member?.subscription_end_date) {
    try {
      const endParts = member.subscription_end_date.split('-').map(Number);
      const endD = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      endD.setMonth(endD.getMonth() - 1);
      // Manual format to avoid UTC timezone day-shift bug
      const y = endD.getFullYear();
      const mo = String(endD.getMonth() + 1).padStart(2, '0');
      const d = String(endD.getDate()).padStart(2, '0');
      subscriptionStartDate = `${d}/${mo}/${y}`;
    } catch(e) { subscriptionStartDate = joiningDate; }
  }
  const startDate = joiningDate; // kept for compatibility

  const paidAmount = parseFloat(payment.amount || 0);
  const planAmount = parseFloat(member?.plan_amount || paidAmount);
  const outstandingDues = parseFloat(member?.outstanding_dues || 0);
  const isFullySettled = outstandingDues === 0;

  // Locker Details for Invoice
  const hasLocker = !!(member?.has_locker || payment?.notes?.toLowerCase().includes("locker"));
  const lockerNo = member?.locker_no || "Assigned Locker";
  const lockerFee = hasLocker ? 50 : 0;
  const seatPlanAmount = hasLocker ? Math.max(0, planAmount - lockerFee) : planAmount;

  // Promised Payment Due Date (if present)
  const rawPromisedDate = member?.due_date || member?.dues_due_date || payment?.dues_due_date;
  const promisedDateFormatted = rawPromisedDate ? rawPromisedDate.split('-').reverse().join('/') : null;

  // Check if overdue
  let isPromisedOverdue = false;
  if (outstandingDues > 0 && rawPromisedDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pParts = rawPromisedDate.split('-').map(Number);
    if (pParts.length === 3) {
      const pDate = new Date(pParts[0], pParts[1] - 1, pParts[2]);
      pDate.setHours(0, 0, 0, 0);
      if (today > pDate) isPromisedOverdue = true;
    }
  }

  // Direct Online Invoice URL link for WhatsApp sharing
  const getInvoiceDirectUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/invoice?id=${receiptNo}`;
    }
    return `http://localhost:3000/invoice?id=${receiptNo}`;
  };

  // WhatsApp Share Handler with Direct Receipt URL Link
  const handleWhatsAppShare = () => {
    const directUrl = getInvoiceDirectUrl();
    let message = `*MINDSPACE LIBRARY - OFFICIAL FEE RECEIPT*\n` +
      `Receipt No: ${receiptNo}\n` +
      `Date Paid: ${receiptDate}\n` +
      `Student Name: ${studentName}\n` +
      `Allotment ID: ${studentAllotmentNo}\n` +
      `Seat Allocated: ${seatNo} (${shiftName})\n` +
      `Amount Paid: ₹${paidAmount} (${payment.payment_mode || "Cash"})\n` +
      `Subscription Validity: ${startDate} to ${endDate}\n`;

    if (!isFullySettled) {
      message += `Outstanding Dues: ₹${outstandingDues}\n`;
      if (promisedDateFormatted) {
        message += `Promised Dues Payment Date: ${promisedDateFormatted} ${isPromisedOverdue ? '(OVERDUE)' : ''}\n`;
      }
      message += `Status: PARTIAL / DUES PENDING\n`;
    } else {
      message += `Status: FULLY SETTLED\n`;
    }

    message += `\n📄 *View / Download Online Fee Receipt:* \n${directUrl}\n\n` +
      `Thank you for studying at MindSpace Library!`;

    const cleanMobile = mobileNo ? mobileNo.replace(/\D/g, "") : "";
    if (cleanMobile.length === 10) {
      window.open(`https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(message)}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-900 font-sans p-4 md:p-10 flex flex-col items-center selection:bg-slate-900 selection:text-white">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #a4-invoice-printable, #a4-invoice-printable * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #a4-invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. Top Action Toolbar (Hidden during Print) */}
      <div className="w-full max-w-[840px] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print-hidden">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices Ledger</span>
        </Link>

        {/* Action Buttons: Print, Download, Share */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 2. Official A4 Size Fee Receipt Card */}
      <div id="a4-invoice-printable" className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[840px] p-8 sm:p-12 space-y-8 print:p-8 print:shadow-none print:w-full">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
          {/* Left Brand Details */}
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 p-0.5 border border-slate-700 shrink-0 relative overflow-hidden">
                <Image src="/assets/logo.jpg" alt="MindSpace Logo" width={48} height={48} className="object-cover rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
                  MINDSPACE LIBRARY
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  AMBIKAPUR MAIN BRANCH
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              MG Road, Near Goyal Super Mart, Patpariya,<br />
              Ambikapur, Chhattisgarh — 497001<br />
              Phone: +91 79746 73138
            </p>
          </div>

          {/* Center Highlight Pill */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 text-center min-w-[200px] shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block mb-1">
              STUDENT / ALLOTMENT NO.
            </span>
            <span className="text-xl font-black text-[#0F172A] font-mono tracking-tight">
              {studentAllotmentNo}
            </span>
          </div>

          {/* Right Invoice Title & No */}
          <div className="text-right space-y-2">
            <h2 className="text-2xl font-black text-[#0F172A] tracking-wider uppercase">
              FEE RECEIPT
            </h2>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1 inline-block text-left min-w-[160px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 font-semibold text-[10px] uppercase">RECEIPT NO</span>
                <span className="font-bold font-mono text-slate-900">{receiptNo}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 font-semibold text-[10px] uppercase">DATE PAID</span>
                <span className="font-bold font-mono text-slate-900">{receiptDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Billed To & Subscription Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {/* Billed To */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              BILLED TO
            </span>
            <p className="text-base font-bold text-[#0F172A] tracking-tight">{studentName}</p>
            <p className="text-slate-600 font-medium">Library ID: <span className="font-bold text-slate-900 font-mono">{libraryId}</span></p>
            <p className="text-slate-600 font-medium">Phone: <span className="font-semibold text-slate-900">{mobileNo}</span></p>
          </div>

          {/* Subscription Details */}
          <div className="space-y-2 md:text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              SUBSCRIPTION DETAILS
            </span>
            <div className="space-y-1 font-medium text-slate-700">
              <p>Shift: <span className="font-bold text-slate-900">{shiftName}</span></p>
              <p>Seat No: <span className="font-bold text-indigo-700 font-mono text-sm">{seatNo}</span></p>
              <p>Locker Facility: <span className={`font-bold font-mono ${member?.has_locker ? "text-emerald-700 font-extrabold" : "text-slate-500"}`}>{member?.has_locker ? `Assigned (${member?.locker_no || 'Standard Locker'})` : 'No Locker Assigned'}</span></p>
              <p>Joining Date: <span className="font-bold text-slate-900 font-mono">{joiningDate}</span></p>
              <p>Subscription Start: <span className="font-bold text-indigo-700 font-mono">{subscriptionStartDate}</span></p>
              <p>Valid Till: <span className="font-bold text-slate-900 font-mono">{endDate}</span></p>
              <p>Duration: <span className="font-bold text-slate-900 font-mono">1 Month</span></p>
            </div>
          </div>
        </div>

        {/* Item Breakdown Table */}
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0F172A] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-5 font-bold">DESCRIPTION</th>
                <th className="py-3 px-5 font-bold text-center">TERM</th>
                <th className="py-3 px-5 font-bold text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr className="bg-white">
                <td className="py-4 px-5">
                  <p className="font-bold text-slate-900 text-sm">Library Membership Desk Subscription</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    High speed Wi-Fi, AC quiet study sanctuary access, reserved cabin desk workstation.
                  </p>
                </td>
                <td className="py-4 px-5 text-center font-semibold font-mono text-slate-700">1 month(s)</td>
                <td className="py-4 px-5 text-right font-bold font-mono text-slate-900 text-sm">₹{seatPlanAmount.toLocaleString()}.00</td>
              </tr>
              {hasLocker && (
                <tr className="bg-slate-50/50">
                  <td className="py-3.5 px-5">
                    <p className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                      <span>Personal Locker Storage Access</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px]">{lockerNo}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Dedicated secure personal storage locker facility allotment.
                    </p>
                  </td>
                  <td className="py-3.5 px-5 text-center font-semibold font-mono text-slate-700">1 month(s)</td>
                  <td className="py-3.5 px-5 text-right font-bold font-mono text-emerald-700 text-xs">₹{lockerFee.toLocaleString()}.00</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction Payment Timeline Box */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
            TRANSACTION PAYMENT DETAILS
          </span>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Payment Mode: <strong className="text-indigo-700 font-mono">{payment.payment_mode || "Cash"}</strong></span>
              <span className="font-mono text-sm font-black text-slate-900">₹{paidAmount.toLocaleString()}.00</span>
            </div>
            {payment.payment_mode === "Split" && (
              <p className="text-[11px] text-slate-600 font-mono font-semibold">
                Split Breakdown: Cash ₹{payment.cash_amount || 0} + Online ₹{payment.online_amount || 0}
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-medium">
              Recorded on <strong className="font-mono text-slate-700">{receiptDate}</strong> — Joining: {startDate}, Expiry: {endDate}. Base Plan: ₹{planAmount}. Amount Paid: ₹{paidAmount}.
            </p>
            {payment.notes && (
              <p className="text-[11px] text-slate-600 italic border-t border-slate-200/60 pt-1 mt-1">
                Note: {payment.notes}
              </p>
            )}
          </div>
        </div>

        {/* Settlement Badge & Summary Calculation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-2">
          {/* Left Settlement & Promised Date Card */}
          <div className="space-y-3">
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
              isFullySettled
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${isFullySettled ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-sm tracking-wide uppercase">
                  {isFullySettled ? "FULLY SETTLED" : "PARTIAL / DUES PENDING"}
                </p>
                <p className="text-[11px] font-medium opacity-90 mt-0.5">
                  {isFullySettled
                    ? "All dues for this subscription have been fully cleared."
                    : `Outstanding Dues Remaining: ₹${outstandingDues}`
                  }
                </p>
              </div>
            </div>

            {/* PROMISED DUE DATE CARD (If dues exist) */}
            {!isFullySettled && (
              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                isPromisedOverdue
                  ? "bg-rose-50 border-rose-300 text-rose-950"
                  : "bg-amber-50 border-amber-300 text-amber-950"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>PROMISED PAYMENT DUE DATE</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                    isPromisedOverdue ? "bg-rose-600 text-white" : "bg-amber-200 text-amber-900"
                  }`}>
                    {isPromisedOverdue ? "OVERDUE" : "PROMISED"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-600">Promised Dues Clearance Date:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {promisedDateFormatted || "Not Set"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * Staff-editable entry. Auto-marked Overdue if missed.
                </p>
              </div>
            )}
          </div>

          {/* Right Grand Total Calculation */}
          <div className="space-y-2 text-xs font-medium text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Subtotal (Seat Subscription Plan)</span>
              <span className="font-mono font-bold text-slate-900">₹{seatPlanAmount.toLocaleString()}.00</span>
            </div>
            {hasLocker && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
                <span>Locker Storage Facility Fee</span>
                <span className="font-mono">+₹{lockerFee.toLocaleString()}.00</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Discount / Adjustment</span>
              <span className="font-mono font-bold text-emerald-600">-₹0.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Total Billing Amount</span>
              <span className="font-mono font-bold text-slate-900">₹{planAmount.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Amount Paid Today</span>
              <span className="font-mono font-bold text-emerald-600">₹{paidAmount.toLocaleString()}.00</span>
            </div>
            {!isFullySettled && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-amber-700">
                <span className="font-bold">Remaining Dues</span>
                <span className="font-mono font-bold">₹{outstandingDues.toLocaleString()}.00</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-base font-black text-[#0F172A] border-t-2 border-slate-900">
              <span className="uppercase tracking-wider">GRAND TOTAL</span>
              <span className="font-mono">₹{paidAmount.toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-200 text-center space-y-1 text-[11px] text-slate-500 font-medium">
          <p className="font-bold text-slate-800">Thank you for studying at MindSpace Library!</p>
          <p className="italic">This is an official computer-generated receipt requiring no physical signature.</p>
        </div>

      </div>
    </div>
  );
}

export default function InvoicePrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] text-slate-200 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-slate-800/80 px-6 py-4 rounded-xl border border-slate-700">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Invoice...</span>
        </div>
      </div>
    }>
      <InvoicePrintContent />
    </Suspense>
  );
}
