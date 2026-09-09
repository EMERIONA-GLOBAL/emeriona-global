import { JournalEntry } from './types';
const secretPattern = /(password|token|secret|private[_-]?key|api[_-]?key|card[_-]?number|cvv|cvc)/i;
export function validateJournalEntry(entry: JournalEntry): void {
  if (!entry.id || !entry.ledgerId || !entry.description || !entry.occurredAt) throw new Error('Invalid journal entry identity');
  if (secretPattern.test(entry.description) || entry.lines.some(l => secretPattern.test(l.description ?? ''))) throw new Error('Secret-like material is not permitted');
  if (entry.lines.length < 2) throw new Error('A journal entry requires at least two lines');
  let debit = 0, credit = 0;
  for (const line of entry.lines) {
    const d = line.debit?.amount ?? 0, c = line.credit?.amount ?? 0;
    if ((d > 0 && c > 0) || (d === 0 && c === 0)) throw new Error('Each line must contain either debit or credit');
    debit += d; credit += c;
  }
  if (Math.abs(debit - credit) > 0.000001) throw new Error('Journal entry must be balanced');
}
