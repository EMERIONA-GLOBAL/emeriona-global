import { Account, AccountId, JournalEntry, JournalEntryId, Ledger, LedgerBalance, LedgerId } from './types';
export interface LedgerRepository { get(id: LedgerId): Promise<Ledger | null>; save(ledger: Ledger): Promise<void>; }
export interface AccountRepository { get(id: AccountId): Promise<Account | null>; list(ledgerId: LedgerId): Promise<Account[]>; save(account: Account): Promise<void>; }
export interface JournalRepository { get(id: JournalEntryId): Promise<JournalEntry | null>; save(entry: JournalEntry): Promise<void>; list(ledgerId: LedgerId): Promise<JournalEntry[]>; }
export interface LedgerPostingPort { post(entry: JournalEntry): Promise<JournalEntry>; void(entryId: JournalEntryId, reason: string): Promise<JournalEntry>; }
export interface LedgerQueryPort { balance(accountId: AccountId, asOf?: string): Promise<LedgerBalance>; trialBalance(ledgerId: LedgerId, asOf?: string): Promise<LedgerBalance[]>; }
export interface LedgerValidationPort { validateEntry(entry: JournalEntry): Promise<void>; }
export interface LedgerAuditPort { record(action: string, entityId: string, context?: Record<string, string>): Promise<void>; }
export interface LedgerTelemetryPort { record(name: string, value?: number, context?: Record<string, string>): Promise<void>; }
export interface LedgerActivationPolicy { isEnabled(ledgerId: LedgerId): Promise<boolean>; }
