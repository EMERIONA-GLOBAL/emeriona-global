import { PaymentRecord, PaymentRequest } from './types';
const SECRET = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|cvv|cvc|card[_-]?number)/i;
function clean(v: unknown): string { return typeof v === 'string' ? v : JSON.stringify(v ?? ''); }
export function rejectSecrets(value: unknown): void { if (SECRET.test(clean(value))) throw new Error('Secret-like payment material is not permitted in the core payment layer.'); }
export function validateMoney(m: PaymentRecord['amount']): void {
  if (!m.currency || m.currency.length !== 3) throw new Error('Currency must be a 3-letter code.');
  if (!Number.isFinite(m.amount) || m.amount <= 0) throw new Error('Payment amount must be a positive finite number.');
}
export function validateRequest(r: PaymentRequest): void { if (!r.customerAccountId || !r.source) throw new Error('Customer account and source are required.'); validateMoney(r.amount); rejectSecrets(r.metadata); }
