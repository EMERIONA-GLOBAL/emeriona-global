import type { DisputeRecord, DisputeResponse } from './types';
const SECRET = /(password|passwd|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|cvv|cvc|pan)/i;
export function validateDispute(d: DisputeRecord): void {
  if (!d.id || !d.paymentId || !d.reasonCode) throw new Error('Missing required dispute identity');
  if (!Number.isFinite(d.amount.amount) || d.amount.amount <= 0) throw new Error('Dispute amount must be positive and finite');
  if (!/^[A-Z]{3}$/.test(d.amount.currency)) throw new Error('Currency must be ISO-style 3 letters');
  if (!d.parties.length) throw new Error('At least one dispute party is required');
  if (SECRET.test(JSON.stringify(d.metadata ?? {}))) throw new Error('Secret-like material is not allowed');
}
export function validateResponse(r: DisputeResponse): void {
  if (!r.disputeId || !r.action || !r.occurredAt) throw new Error('Invalid dispute response');
  if (SECRET.test(r.note ?? '')) throw new Error('Secret-like material is not allowed');
}