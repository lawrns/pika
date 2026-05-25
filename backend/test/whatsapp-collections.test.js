import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, createHmac } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DemoSpeiProvider } from '../src/providers/payments/DemoSpeiProvider.js';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('public payer page never simulates or falls back to paid success', () => {
  const source = read('frontend/src/components/pages/PublicPayerPage.tsx');
  assert.equal(source.includes("setStatus('success')"), false);
  assert.equal(source.includes('Fallback matching slug concepts'), false);
  assert.equal(source.includes('Failback to visual success'), false);
});

test('create request page does not mint fake local slugs when API fails', () => {
  const source = read('frontend/src/components/pages/CreateRequestPage.tsx');
  assert.equal(source.includes("'pika_' + Math.random"), false);
  assert.equal(source.includes('catch (err)'), true);
});

test('v1 request flow binds resources to authenticated user, not static demo users', () => {
  const source = read('backend/src/routes/v1.js');
  assert.equal(source.includes('usr_mariana'), false);
  assert.equal(source.includes('Mariana Báez'), false);
  assert.equal(source.includes('usr_anonymous_payer'), false);
  assert.match(source, /authenticateToken/);
});

test('v1 request flow exposes share events, contacts, reminders and receipt endpoint', () => {
  const source = read('backend/src/routes/v1.js');
  for (const pattern of [
    "router.post('/requests/:requestId/share'",
    "router.get('/requests/:requestId/events'",
    "router.post('/requests/:requestId/reminders'",
    "router.get('/public/payments/:paymentId/receipt'",
    "router.get('/contacts'",
    "router.post('/contacts'"
  ]) {
    assert.ok(source.includes(pattern), `${pattern} missing`);
  }
});

test('demo SPEI provider requires signed webhooks and produces stable event ids', async () => {
  const provider = new DemoSpeiProvider({ webhookSecret: 'test-secret' });
  const payload = { paymentId: 'pay_1', providerPaymentRef: 'demo_1', status: 'confirmed', amountCents: 12345, currency: 'MXN' };
  const rawBody = JSON.stringify(payload);
  const signature = createHmac('sha256', 'test-secret').update(rawBody).digest('hex');
  const verified = await provider.verifyWebhook({ headers: { 'x-pika-signature': signature }, rawBody });
  assert.equal(verified.valid, true);
  assert.equal(verified.providerEventId, createHash('sha256').update(rawBody).digest('hex'));
  assert.equal(verified.normalized.status, 'confirmed');

  const rejected = await provider.verifyWebhook({ headers: { 'x-pika-signature': 'bad' }, rawBody });
  assert.equal(rejected.valid, false);
});
