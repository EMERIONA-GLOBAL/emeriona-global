export * from './types';
export * from './contracts';
export * from './validation';
export * from './lifecycle';

export type InvoiceId = string;
export type CustomerAccountId = string;
export type Money = { amount: number; currency: string };
export type InvoiceStatus = 'DRAFT'|'ISSUED'|'PAID'|'PARTIALLY_PAID'|'VOIDED'|'OVERDUE'|'CANCELLED';
export interface InvoiceLine { id:string; description:string; quantity:number; unitPrice:Money; subtotal:Money; tax?:Money; total:Money; }
export interface Invoice { id:InvoiceId; customerAccountId:CustomerAccountId; currency:string; status:InvoiceStatus; lines:InvoiceLine[]; subtotal:Money; tax:Money; total:Money; dueAt?:string; issuedAt?:string; createdAt:string; }
export interface BillingDocumentRepository { save(invoice:Invoice):Promise<void>; get(id:InvoiceId):Promise<Invoice|undefined>; }
export interface InvoicePort { issue(invoice:Invoice):Promise<Invoice>; void(id:InvoiceId,reason:string):Promise<Invoice>; }
export interface BillingAuditPort { record(action:string,id:InvoiceId,metadata?:Record<string,string>):Promise<void>; }
export interface BillingTelemetryPort { record(metric:string,value:number):Promise<void>; }
export function validateInvoice(invoice:Invoice):void { if(!invoice.id||!invoice.customerAccountId) throw new Error('Invoice identity is required'); if(!invoice.lines.length) throw new Error('Invoice requires lines'); if(!Number.isFinite(invoice.total.amount)||invoice.total.amount<0) throw new Error('Invalid invoice total'); for(const l of invoice.lines) if(!Number.isFinite(l.quantity)||l.quantity<=0) throw new Error('Invalid invoice quantity'); }
export class InvoiceLifecycle { constructor(private readonly repo:BillingDocumentRepository,private readonly port:InvoicePort,private readonly audit:BillingAuditPort,private readonly telemetry:BillingTelemetryPort){} async issue(i:Invoice){validateInvoice(i);const r=await this.port.issue(i);await this.repo.save(r);await this.audit.record('INVOICE_ISSUED',r.id,{status:r.status});await this.telemetry.record('billing.invoice.issued',1);return r;} async void(id:InvoiceId,reason:string){if(!reason.trim())throw new Error('Void reason is required');const r=await this.port.void(id,reason);await this.repo.save(r);await this.audit.record('INVOICE_VOIDED',id);await this.telemetry.record('billing.invoice.voided',1);return r;} }
