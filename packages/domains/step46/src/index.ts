export type PayoutId=string; export type AccountId=string; export type Money={amount:number;currency:string};
export type PayoutStatus='PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'|'CANCELLED';
export interface Payout{id:PayoutId;accountId:AccountId;amount:Money;status:PayoutStatus;reference?:string;createdAt:string;completedAt?:string;}
export interface PayoutRepository{save(p:Payout):Promise<void>;get(id:PayoutId):Promise<Payout|undefined>};
export interface PayoutPort{execute(p:Payout):Promise<Payout>;cancel(id:PayoutId,reason:string):Promise<Payout>};
export interface PayoutAuditPort{record(action:string,id:PayoutId):Promise<void>};
export function validatePayout(p:Payout){if(!p.id||!p.accountId||!p.createdAt)throw new Error('Payout identity is required');if(!Number.isFinite(p.amount.amount)||p.amount.amount<=0)throw new Error('Invalid payout amount');if(!p.amount.currency)throw new Error('Currency is required');}
export class PayoutLifecycle{constructor(private repo:PayoutRepository,private port:PayoutPort,private audit:PayoutAuditPort){}async execute(p:Payout){validatePayout(p);const r=await this.port.execute(p);await this.repo.save(r);await this.audit.record('PAYOUT_EXECUTED',r.id);return r;}async cancel(id:PayoutId,reason:string){if(!reason.trim())throw new Error('Cancellation reason is required');const r=await this.port.cancel(id,reason);await this.repo.save(r);await this.audit.record('PAYOUT_CANCELLED',id);return r;}}
