import { paymentBelongsToMember } from './memberIdentity.js';

export const money = value => Math.round((Number(value) || 0) * 100) / 100;

export function paymentContext(member, payments = []) {
  const dues = Math.max(0, money(member?.outstanding_dues));
  const hasHistory = !!member && payments.some(p => paymentBelongsToMember(p, member));
  const validExpiry = member?.subscription_end_date && !String(member.subscription_end_date).startsWith('1970');

  // A brand new student with no payment record in history is in initial admission stage
  const firstPayment = !!member && !hasHistory;

  // canCollect: Student has pending dues from a previously recorded payment cycle
  const canCollect = dues > 0 && hasHistory;

  // blockRenewal: If student has pending dues on an active cycle, require collecting dues first
  const blockRenewal = dues > 0 && hasHistory;

  return { dues, hasHistory, firstPayment, canCollect, blockRenewal };
}

export function paymentResult({ type, payable, collected, context, dueDate, isCustom = false }) {
  const amount = Number(collected), total = Number(payable);
  if (collected === '' || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(total) || total < 0) throw new Error('Enter a valid amount.');
  if (type === 'COLLECT_DUES') {
    if (context.dues <= 0 && total <= 0) throw new Error('There are no outstanding dues to collect.');
    const maxPayable = total > 0 ? total : context.dues;
    if (money(amount) > maxPayable) throw new Error(`Collected amount (₹${amount}) cannot exceed payable amount of ₹${maxPayable}.`);
  } else if (context.blockRenewal && !isCustom) {
    throw new Error(`Student has ₹${context.dues} pending dues from current subscription cycle! Please use 'Collect Dues' to clear the pending dues first.`);
  }
  if (type === 'FULL' && money(amount) !== money(total)) throw new Error('Full Payment must equal Net Payable. Use Partial Payment for a smaller amount.');
  if (type === 'PARTIAL' && !(amount > 0 && money(amount) < money(total))) throw new Error('Partial Payment must be greater than zero and less than Net Payable.');
  if (type === 'PAY_LATER' && (amount !== 0 || total <= 0)) throw new Error('Pay Later collects zero and requires a positive plan amount.');
  if (!['FULL', 'PARTIAL', 'PAY_LATER', 'COLLECT_DUES'].includes(type)) throw new Error('Select a payment scheme.');
  const remaining = Math.max(0, money((type === 'COLLECT_DUES' && (!total || total === context.dues) ? context.dues : total) - amount));
  if (remaining > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || '') || new Date(dueDate + 'T12:00:00Z').toISOString().slice(0, 10) !== dueDate)) throw new Error('Set a valid promised payment due date for the remaining balance.');
  return { remaining, renew: type !== 'COLLECT_DUES', dateOnly: type === 'COLLECT_DUES' && amount === 0 };
}

