// IDs are authoritative. Never attach a payment to another person by name.
export function paymentBelongsToMember(payment, member) {
  if (!payment?.member_id || !member) return false;
  const id = String(payment.member_id).trim().toLowerCase();
  return [member.id, member.permanent_id, member.student_no]
    .filter(Boolean).some(value => String(value).trim().toLowerCase() === id);
}
export function findExactInvoice(payments, id) {
  if (!id) return null;
  const needle = String(id).trim().toLowerCase();
  const primary = payments.find(p => String(p.id || '').toLowerCase() === needle);
  if (primary) return primary;
  const matches = payments.filter(p => p.invoice_id && String(p.invoice_id).trim().toLowerCase() === needle);
  return matches.length === 1 ? matches[0] : null;
}
