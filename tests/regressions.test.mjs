import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server.js';
import * as security from '../lib/server/security.js';
import { paymentBelongsToMember, findExactInvoice } from '../lib/memberIdentity.js';

process.env.SESSION_SECRET = 'test-only-secret-not-used-by-the-application-12345';
const quiet = { log() {}, warn() {}, error() {} };
function load(file, dependencies = {}) {
  const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm, '')
    .replace(/^export \{[^}]+\};?\r?\n/gm, '')
    .replace(/^export /gm, '');
  const context = vm.createContext({ console: quiet, crypto: { randomUUID }, URL, Headers, Request, Response, AbortSignal, Buffer, process, fetch: () => { throw new Error('Real network access forbidden in tests'); }, ...dependencies });
  vm.runInContext(source, context, { filename: file });
  return context;
}
const member = { id: 'member-a', permanent_id: 'MSL0001', full_name: 'Same Name', is_active: true, subscription_end_date: '2030-01-01', outstanding_dues: 500 };
function service({ insertError = null, updateError = null } = {}) {
  const calls = [];
  const supabase = { from(table) {
    const chain = {
      select() { return chain; }, eq() { return chain; },
      single: async () => ({ data: member, error: null }),
      insert: async data => { calls.push({ operation: 'insert', table, data }); return { error: insertError }; }
    };
    return chain;
  } };
  const context = load('lib/adminService.js', { supabase, paymentBelongsToMember });
  context.captureUpdate = updates => { calls.push({ operation: 'update', updates }); if (updateError) throw new Error(updateError); return updates; };
  vm.runInContext('updateMember = async (id, updates) => captureUpdate(updates); logActivity = async () => {};', context);
  return { context, calls };
}
test('failed payment insert does not change dues or return success', async () => {
  const { context, calls } = service({ insertError: { message: 'offline' } });
  await assert.rejects(context.recordPayment({ member_id: member.id, amount: 500 }), /not saved/);
  assert.equal(calls.filter(c => c.operation === 'update').length, 0);
});
test('successful payment updates balance after the receipt is saved', async () => {
  const { context, calls } = service();
  const result = await context.recordPayment({ member_id: member.id, amount: 500 });
  assert.equal(calls[0].table, 'payments');
  assert.equal(calls[1].updates.outstanding_dues, 0);
  assert.ok(result.id);
});
test('collect dues preserves modified subscription start and end dates', async () => {
  const { context, calls } = service();
  await context.recordPayment({
    member_id: member.id,
    amount: 300,
    payment_type: 'COLLECT_DUES',
    start_date: '2030-01-05',
    end_date: '2030-02-05'
  });
  const updateCall = calls.find(c => c.operation === 'update');
  assert.ok(updateCall);
  assert.equal(updateCall.updates.subscription_end_date, '2030-02-05');
  assert.equal(updateCall.updates.joining_date, '2030-01-05');
  assert.equal(updateCall.updates.outstanding_dues, 200);
});
test('custom plan amount is persisted in member record on payment', async () => {
  const { context, calls } = service();
  await context.recordPayment({
    member_id: member.id,
    amount: 300,
    payment_type: 'COLLECT_DUES',
    plan_amount: 300,
    new_outstanding_dues: 0
  });
  const updateCall = calls.find(c => c.operation === 'update');
  assert.ok(updateCall);
  assert.equal(updateCall.updates.plan_amount, 300);
  assert.equal(updateCall.updates.outstanding_dues, 0);
});
test('partial write gives an explicit saved-receipt warning, not a retry prompt', async () => {
  const { context, calls } = service({ updateError: 'offline' });
  const result = await context.recordPayment({ member_id: member.id, amount: 500 });
  assert.equal(result.memberUpdateFailed, true);
  assert.match(result.warning, /Do not record this payment again/);
  assert.equal(calls.filter(c => c.operation === 'insert').length, 1);
});
test('invalid or mismatched split amounts never reach the database', async () => {
  const { context, calls } = service();
  for (const amount of [-1, 'bad']) await assert.rejects(context.recordPayment({ amount }));
  await assert.rejects(context.recordPayment({ amount: 500, payment_mode: 'Split', cash_amount: 100, online_amount: 100 }));
  assert.equal(calls.length, 0);
});
test('new receipt numbers are unique even at the same timestamp', async () => {
  const { context } = service();
  const a = await context.recordPayment({ amount: 1 });
  const b = await context.recordPayment({ amount: 1 });
  assert.notEqual(a.invoice_id, b.invoice_id);
});
test('same names with different IDs cannot change subscription dates', () => {
  const { context } = service();
  const result = context.getMemberSubscriptionDates({ ...member, joining_date: '2026-01-01', subscription_end_date: null }, [{ member_id: 'member-b', member_name: member.full_name, paid_at: '2026-10-10' }]);
  assert.equal(result.subStart, '2026-01-01');
  assert.equal(paymentBelongsToMember({ member_id: 'MSL0001' }, member), true);
  assert.equal(paymentBelongsToMember({ member_name: member.full_name }, member), false);
});
test('exact invoice matching rejects prefixes, missing IDs, and duplicate numbers', () => {
  const payments = [{ id: 'a', invoice_id: 'INV-123456' }, { id: 'b', invoice_id: 'INV-123457' }];
  assert.equal(findExactInvoice(payments, 'INV-123'), null);
  assert.equal(findExactInvoice(payments, 'missing'), null);
  assert.equal(findExactInvoice(payments, null), null);
  assert.equal(findExactInvoice(payments, 'a').id, 'a');
  assert.equal(findExactInvoice([...payments, { id: 'c', invoice_id: 'INV-123456' }], 'INV-123456'), null);
});
test('month arithmetic handles month ends and Date objects', () => {
  const { context } = service();
  assert.equal(context.addOneMonth('2026-01-31'), '2026-02-28');
  assert.equal(vm.runInContext("addOneMonth(new Date('2026-01-15T12:00:00Z'))", context), '2026-02-15');
});
function session(role = 'admin') {
  return security.signToken({ purpose: 'session', role, name: 'Test', exp: Date.now() + 60000 });
}
function request(path, { method = 'GET', role, body, origin = 'http://localhost:3000' } = {}) {
  return new Request('http://localhost:3000' + path, { method, headers: { origin, 'Content-Type': 'application/json', ...(role ? { cookie: `${security.COOKIE}=${session(role)}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('signed sessions reject tampering, expiry, and invoice-token substitution', () => {
  assert.equal(security.verifyToken(session()).role, 'admin');
  assert.equal(security.verifyToken(session() + 'tampered'), null);
  assert.equal(security.verifyToken(security.signToken({ purpose: 'session', role: 'admin', exp: 1 })), null);
  assert.equal(security.verifyToken(security.signToken({ purpose: 'invoice', id: 'a', exp: Date.now() + 1000 })), null);
  assert.equal(security.sessionFromRequest(request('/api/auth')), null);
});
test('staff cannot access admin pages or nested admin paths', () => {
  for (const path of ['/dashboard/settings', '/dashboard/expenses', '/dashboard/analytics/detail']) assert.equal(security.allowedPage('staff', path), false);
  assert.equal(security.allowedPage('staff', '/dashboard/members'), true);
});
test('credential hashes verify and public settings exclude secrets', () => {
  const hash = security.hashPassword('test-password');
  assert.equal(security.checkPassword('test-password', hash), true);
  assert.equal(security.checkPassword('wrong-password', hash), false);
  assert.deepEqual(security.publicSettings({ heroImage: '/image.jpg', adminPassword: 'hidden', staffUsername: 'hidden', apiKey: 'hidden' }), { heroImage: '/image.jpg' });
});
test('gateway rejects unsigned clients, role escalation, joins, and CSRF without network calls', async () => {
  const route = load('app/api/database/[...path]/route.js', security);
  const ctx = table => ({ params: Promise.resolve({ path: ['rest', 'v1', table] }) });
  assert.equal((await route.handle(request('/api/database/rest/v1/members'), ctx('members'))).status, 401);
  assert.equal((await route.handle(request('/api/database/rest/v1/expenses', { role: 'staff' }), ctx('expenses'))).status, 403);
  assert.equal((await route.handle(request('/api/database/rest/v1/members', { role: 'staff', method: 'DELETE' }), ctx('members'))).status, 403);
  assert.equal((await route.handle(request('/api/database/rest/v1/members?select=*,expenses(*)', { role: 'staff' }), ctx('members'))).status, 400);
  assert.equal((await route.handle(request('/api/database/rest/v1/members', { role: 'admin', method: 'POST', origin: 'https://evil.invalid', body: {} }), ctx('members'))).status, 403);
  assert.equal((await route.handle(request('/api/database/rest/v1/site_settings', { role: 'admin' }), ctx('site_settings'))).status, 403);
});
test('public enquiry returns failure when insert fails', async () => {
  let writes = 0;
  const route = load('app/api/enquiries/route.js', { ...security, randomUUID, database: () => ({ from: () => ({ insert: async () => { writes++; return { error: { message: 'simulated failure' } }; } }) }) });
  const response = await route.POST(request('/api/enquiries', { method: 'POST', body: { name: 'Test', mobile: '9999999999' } }));
  assert.equal(response.status, 503);
  assert.equal(writes, 1);
  assert.equal((await response.json()).success, undefined);
});
test('settings edits merge with existing content and preserve existing credentials', async () => {
  let written;
  const previous = { heroImage: 'old.jpg', founderName: 'Existing', adminPassword: 'legacy-secret' };
  const route = load('app/api/settings/route.js', { ...security, readSettings: async () => previous, database: () => ({ from: () => ({ upsert: async value => { written = value; return { error: null }; } }) }) });
  const response = await route.POST(request('/api/settings', { role: 'admin', method: 'POST', body: { heroImage: 'new.jpg' } }));
  assert.equal(response.status, 200);
  assert.equal(written.content.adminPassword, previous.adminPassword);
  assert.equal(written.content.founderName, previous.founderName);
  assert.equal(previous.heroImage, 'old.jpg');
});
test('invoice API requires a session or scoped signed token', async () => {
  const route = load('app/api/invoice/route.js', { ...security, database: () => { throw new Error('Must not access database'); } });
  assert.equal((await route.GET(request('/api/invoice?id=INV-1'))).status, 401);
  assert.equal((await route.GET(request('/api/invoice?token=forged'))).status, 401);
});
test('invoice API uses exact equality and never falls back to newest receipt', async () => {
  let filter;
  const chain = { select() { return chain; }, eq(column, id) { filter = { column, id }; return chain; }, limit: async () => ({ data: [], error: null }) };
  const route = load('app/api/invoice/route.js', { ...security, database: () => ({ from: () => chain }) });
  assert.equal((await route.GET(request('/api/invoice?id=NONEXISTENT', { role: 'admin' }))).status, 404);
  assert.deepEqual(filter, { column: 'invoice_id', id: 'NONEXISTENT' });
});
test('login verifies credentials on server and issues an HttpOnly cookie', async () => {
  const route = load('app/api/auth/route.js', { ...security, NextResponse, readSettings: async () => ({ adminUsername: 'test-admin', adminPassword: 'test-password' }) });
  const failed = await route.POST(request('/api/auth', { method: 'POST', body: { username: 'test-admin', password: 'wrong' } }));
  assert.equal(failed.status, 401);
  const success = await route.POST(request('/api/auth', { method: 'POST', body: { username: 'test-admin', password: 'test-password' } }));
  assert.equal(success.status, 200);
  assert.match(success.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(success.headers.get('set-cookie'), /SameSite=strict/i);
  assert.equal((await success.json()).password, undefined);
});
test('enquiry UI retains user inputs when the server rejects saving', async () => {
  const source = fs.readFileSync(new URL('../components/EnquiryForm.jsx', import.meta.url), 'utf8');
  const begin = source.indexOf('  const handleSubmit =');
  const end = source.indexOf('\n  return (', begin);
  const statuses = [], errors = [], resets = [];
  const context = vm.createContext({ form: { name: 'Test', mobile: '9999999999' }, status: 'idle', setStatus: value => statuses.push(value), setError: value => errors.push(value), setForm: value => resets.push(value), fetch: async () => Response.json({ error: 'Not saved' }, { status: 503 }) });
  vm.runInContext(source.slice(begin, end) + '; globalThis.submit = handleSubmit;', context);
  await context.submit({ preventDefault() {} });
  assert.deepEqual(statuses, ['submitting', 'idle']);
  assert.equal(resets.length, 0);
  assert.equal(errors.at(-1), 'Not saved');
});
