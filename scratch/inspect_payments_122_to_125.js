import { supabase } from "../lib/supabase.js";

async function inspectPayments() {
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .or('member_name.ilike.%satish%,member_name.ilike.%nilesh%,member_name.ilike.%saurabh%,member_name.ilike.%surbhi%')
    .order('created_at', { ascending: true });

  console.log("Payments for satish, nilesh, saurabh, surbhi:");
  console.table(payments.map(p => ({
    id: p.id,
    invoice_id: p.invoice_id,
    member_id: p.member_id,
    member_name: p.member_name,
    amount: p.amount,
    created_at: p.created_at,
    paid_at: p.paid_at,
    notes: p.notes
  })));

  process.exit(0);
}

inspectPayments();
