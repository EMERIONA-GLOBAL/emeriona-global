import { SettlementRecord } from './types';

const SECRET = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|cvv|cvc|pan|card[_-]?number)/i;
export function validateSettlement(record: SettlementRecord): void {
  if (!record.id || !record.reference || !record.createdAt) throw new Error('Settlement identity is required');
  if (!Number.isFinite(record.gross.amount) || record.gross.amount < 0) throw new Error('Invalid gross amount');
  if (!Number.isFinite(record.net.amount) || record.net.amount < 0) throw new Error('Invalid net amount');
  if (!record.gross.currency || !record.net.currency || record.gross.currency !== record.net.currency) throw new Error('Currency mismatch');
  if (record.fees && (!Number.isFinite(record.fees.amount) || record.fees.amount < 0)) throw new Error('Invalid fees');
  const expected = record.gross.amount - (record.fees?.amount ?? 0);
  if (Math.abs(expected - record.net.amount) > 0.000001) throw new Error('Gross, fees and net are inconsistent');
  if (SECRET.test(JSON.stringify(record))) throw new Error('Secret-like material is not permitted in settlement records');
}
