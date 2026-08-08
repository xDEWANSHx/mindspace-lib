"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchPayments, fetchMembers, formatDate } from "@/lib/adminService";
import { Printer, Download, Share2, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
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
  const receiptDate = payment.paid_at ? payment.paid_at.substring(0, 10).split('-').reverse().join('/') : formatDate(new Date()).split('-').reverse().join('/');
  const studentAllotmentNo = member?.permanent_id || `#MS26B${Date.now().toString().slice(-2)}`;
  const studentName = (payment.member_name || member?.full_name || "PREM SAGAR GUPTA").toUpperCase();
  const libraryId = member?.student_no || "MSB154";
  const mobileNo = member?.mobile || "+91 9171345530";
  const shiftName = member?.shift || "Full Day";
  const seatNo = member?.seat_no || "131";
  const startDate = member?.joining_date ? member.joining_date.split('-').reverse().join('/') : receiptDate;
  const endDate = member?.subscription_end_date ? member.subscription_end_date.split('-').reverse().join('/') : "29/08/2026";
  const paidAmount = parseFloat(payment.amount || 1000);
  const planAmount = parseFloat(member?.plan_amount || paidAmount);
  const isFullySettled = (member?.outstanding_dues || 0) === 0;

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const message = `*MINDSPACE LIBRARY - OFFICIAL FEE RECEIPT*\n` +
      `Receipt No: ${receiptNo}\n` +
      `Student Name: ${studentName}\n` +
      `Allotment ID: ${studentAllotmentNo}\n` +
      `Seat Allocated: ${seatNo} (${shiftName})\n` +
      `Amount Paid: ₹${paidAmount}\n` +
      `Validity: ${startDate} to ${endDate}\n` +
      `Status: ${isFullySettled ? 'FULLY SETTLED' : 'PARTIAL'}\n\n` +
      `Thank you for studying at MindSpace Library!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-900 font-sans p-4 md:p-10 flex flex-col items-center selection:bg-slate-900 selection:text-white">
      {/* 1. Top Action Toolbar (Hidden during Print) */}
      <div className="w-full max-w-[840px] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[840px] p-8 sm:p-12 space-y-8 print:p-8 print:shadow-none print:border-none print:w-full">
        
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
              Phone: +91 9171345530
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
                <span className="text-slate-400 font-semibold text-[10px] uppercase">DATE</span>
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
              <p>Join/Start Date: <span className="font-bold text-slate-900 font-mono">{startDate}</span></p>
              <p>Valid Till: <span className="font-bold text-slate-900 font-mono">{endDate}</span></p>
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
                  <p className="font-bold text-slate-900 text-sm">Library Membership Subscription</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    High speed Wi-Fi, AC quiet study sanctuary access, reserved cabin desk workstation.
                  </p>
                </td>
                <td className="py-4 px-5 text-center font-semibold font-mono text-slate-700">1 month(s)</td>
                <td className="py-4 px-5 text-right font-bold font-mono text-slate-900 text-sm">₹{planAmount.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Transaction Payment Timeline Box */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
            TRANSACTION PAYMENT TIMELINE
          </span>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Installment #1 ({payment.payment_mode || "Online/UPI"})</span>
              <span className="font-mono text-sm">₹{paidAmount.toLocaleString()}.00</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Recorded on {receiptDate} — Joining: {startDate}, Expiry: {endDate}. Base Plan: ₹{planAmount}. Amount Paid: ₹{paidAmount}.
            </p>
          </div>
        </div>

        {/* Settlement Badge & Summary Calculation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          {/* Left Settlement Card */}
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
                {isFullySettled ? "FULLY SETTLED" : "PARTIAL PAYMENT"}
              </p>
              <p className="text-[11px] font-medium opacity-80 mt-0.5">
                {isFullySettled
                  ? "All dues for this subscription have been fully cleared."
                  : `Outstanding Dues Remaining: ₹${member?.outstanding_dues || 0}`
                }
              </p>
            </div>
          </div>

          {/* Right Grand Total Calculation */}
          <div className="space-y-2 text-xs font-medium text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Subtotal (Plan Price)</span>
              <span className="font-mono font-bold text-slate-900">₹{planAmount.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Discount / Adjustment</span>
              <span className="font-mono font-bold text-emerald-600">-₹0.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Total Billing</span>
              <span className="font-mono font-bold text-slate-900">₹{paidAmount.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Amount Paid</span>
              <span className="font-mono font-bold text-emerald-600">₹{paidAmount.toLocaleString()}.00</span>
            </div>
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
