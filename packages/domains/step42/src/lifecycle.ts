import { JournalEntry, JournalEntryId, LedgerId } from './types';
import { JournalRepository, LedgerActivationPolicy, LedgerAuditPort, LedgerPostingPort, LedgerTelemetryPort, LedgerValidationPort } from './contracts';
import { validateJournalEntry } from './validation';
export class LedgerLifecycle {
  constructor(private readonly journal: JournalRepository, private readonly posting: LedgerPostingPort, private readonly validation: LedgerValidationPort | null, private readonly activation: LedgerActivationPolicy, private readonly audit: LedgerAuditPort, private readonly telemetry: LedgerTelemetryPort) {}
  async post(entry: JournalEntry): Promise<JournalEntry> {
    if (!(await this.activation.isEnabled(entry.ledgerId))) throw new Error('Ledger is not active');
    validateJournalEntry(entry); await this.validation?.validateEntry(entry);
    const posted = await this.posting.post(entry); await this.journal.save(posted);
    await this.audit.record('LEDGER_ENTRY_POSTED', posted.id);
    await this.telemetry.record('ledger.entry.posted', 1, { ledgerId: posted.ledgerId });
    return posted;
  }
  async void(entryId: JournalEntryId, ledgerId: LedgerId, reason: string): Promise<JournalEntry> {
    if (!(await this.activation.isEnabled(ledgerId))) throw new Error('Ledger is not active');
    if (!reason.trim()) throw new Error('Void reason is required');
    const entry = await this.posting.void(entryId, reason); await this.journal.save(entry);
    await this.audit.record('LEDGER_ENTRY_VOIDED', entryId, { reason });
    await this.telemetry.record('ledger.entry.voided', 1, { ledgerId });
    return entry;
  }
}
