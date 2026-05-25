import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas } from '../src/middleware/validation.js';
import { createIdempotencyKey } from '../src/utils/transaction.js';
import { validateEnvironment } from '../src/config/env.js';

test('payment links are Mexico-first and reject USD', () => {
  const result = schemas.createPaymentLink.validate({ amount: 250, currency: 'USD', description: 'Test' });
  assert.equal(result.error?.details[0]?.path[0], 'currency');
});

test('payment links default to MXN with bounded expiration', () => {
  const result = schemas.createPaymentLink.validate({ amount: 250, description: 'WhatsApp order' });
  assert.equal(result.error, undefined);
  assert.equal(result.value.currency, 'MXN');
  assert.equal(result.value.expiresIn, 24);
});

test('public payment intent strips unknown data and validates email', () => {
  const result = schemas.publicPaymentIntent.validate({ name: 'Cliente', email: 'bad-email', cardNumber: '4111111111111111' }, { stripUnknown: true });
  assert.ok(result.error);
  assert.equal(result.error.details[0].path[0], 'email');
});

test('idempotency keys are stable and operation scoped', () => {
  assert.equal(
    createIdempotencyKey('user_1', 'create-payment-link', 'req_1'),
    'user_1:create-payment-link:req_1'
  );
});

test('production environment validation requires critical runtime secrets', () => {
  const result = validateEnvironment({ NODE_ENV: 'production', JWT_SECRET: 'short' });
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('DATABASE_URL'));
  assert.ok(result.missing.includes('REDIS_URL'));
  assert.ok(result.missing.includes('JWT_SECRET_MIN_32_CHARS'));
});
