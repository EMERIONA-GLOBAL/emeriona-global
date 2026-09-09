import type { PayoutInstruction, PayoutRecord } from './types';
const SECRET=/password|secret|token|api[_-]?key|private[_-]?key|cvv|pan/i;
export function validatePayout(p:PayoutRecord):void {
 if(!p.id||!p.kind||!p.source||!p.beneficiary?.accountId) throw new Error('Invalid payout identity or beneficiary reference');
 if(!Number.isFinite(p.amount.amount)||p.amount.amount<=0) throw new Error('Payout amount must be positive and finite');
 if(!/^[A-Z]{3}$/.test(p.amount.currency)) throw new Error('Currency must be a 3-letter ISO-style code');
 if(SECRET.test(JSON.stringify(p))) throw new Error('Secret-like material is not permitted in payout records');
 if(Number.isNaN(Date.parse(p.createdAt))||Number.isNaN(Date.parse(p.updatedAt))) throw new Error('Invalid timestamps');
}
export function validateInstruction(i:PayoutInstruction):void { if(!i.payoutId||!i.idempotencyKey||i.idempotencyKey.length>256) throw new Error('Invalid payout instruction'); }