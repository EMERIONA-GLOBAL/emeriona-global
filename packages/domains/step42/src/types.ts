export type LedgerId = string & { readonly __ledgerId: unique symbol };
export type AccountId = string & { readonly __accountId: unique symbol };
export type JournalEntryId = string & { readonly __journalEntryId: unique symbol };
export type Money = { amount: number; currency: string };
export type LedgerEntryStatus = 'DRAFT' | 'POSTED' | 'VOIDED';
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type EntrySource = 'COMMERCE' | 'PAYMENT' | 'REFUND' | 'FULFILLMENT' | 'MANUAL' | 'ADJUSTMENT' | 'IMPORT' | 'SYSTEM';
export interface Ledger { id: LedgerId; tenantId?: string; name: string; currency: string; active: boolean; createdAt: string; }
export interface Account { id: AccountId; ledgerId: LedgerId; code: string; name: string; type: AccountType; normalBalance: NormalBalance; active: boolean; }
export interface JournalLine { accountId: AccountId; debit?: Money; credit?: Money; description?: string; }
export interface JournalEntry { id: JournalEntryId; ledgerId: LedgerId; source: EntrySource; sourceReference?: string; description: string; status: LedgerEntryStatus; lines: JournalLine[]; occurredAt: string; postedAt?: string; correlationId?: string; }
export interface LedgerBalance { accountId: AccountId; debit: Money; credit: Money; balance: Money; asOf: string; }
