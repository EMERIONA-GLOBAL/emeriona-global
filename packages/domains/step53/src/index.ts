export type ISODateTime = string;
export type Identifier = string;

export type ReferralStatus = 'DRAFT'|'ACTIVE'|'PAUSED'|'CONVERTED'|'EXPIRED'|'CANCELLED';
export type ReferralKind = 'CUSTOMER_REFERRAL'|'PARTNER_REFERRAL'|'AFFILIATE'|'CAMPAIGN'|'CUSTOM';
export type CommissionStatus = 'PENDING'|'APPROVED'|'PROCESSING'|'EARNED'|'REVERSED'|'CANCELLED';
export type ReferralEvent = 'CLICKED'|'REGISTERED'|'QUALIFIED'|'CONVERTED'|'REFUNDED'|'CHARGEBACK';

export interface Money { amount:number; currency:string; }
export interface ReferralCode { code:string; programId:Identifier; ownerId:Identifier; status:'ACTIVE'|'PAUSED'|'EXPIRED'; expiresAt?:ISODateTime; }
export interface ReferralContext { tenantId:Identifier; actorId?:Identifier; correlationId?:Identifier; locale?:string; region?:string; }
export interface ReferralRecord {
  id:Identifier; programId:Identifier; tenantId:Identifier; kind:ReferralKind; ownerId:Identifier;
  referredPartyId?:Identifier; code?:string; status:ReferralStatus; event?:ReferralEvent;
  sourceReference?:Identifier; orderReference?:Identifier; subscriptionReference?:Identifier;
  createdAt:ISODateTime; updatedAt:ISODateTime; expiresAt?:ISODateTime;
}
export interface CommissionRecord {
  id:Identifier; referralId:Identifier; beneficiaryId:Identifier; amount:Money;
  status:CommissionStatus; basisReference?:Identifier; settlementReference?:Identifier;
  payoutReference?:Identifier; ledgerReference?:Identifier; createdAt:ISODateTime; updatedAt:ISODateTime;
}
export interface ReferralProgram { id:Identifier; tenantId:Identifier; name:string; active:boolean; defaultCommission?:Money; }
export type ReferralResult<T> = { ok:true; value:T } | { ok:false; code:string; message:string };

export interface ReferralRepository { create(r:ReferralRecord):Promise<ReferralRecord>; get(id:Identifier):Promise<ReferralRecord|undefined>; update(r:ReferralRecord):Promise<ReferralRecord>; }
export interface CommissionRepository { create(r:CommissionRecord):Promise<CommissionRecord>; get(id:Identifier):Promise<CommissionRecord|undefined>; update(r:CommissionRecord):Promise<CommissionRecord>; }
export interface ReferralProgramPort { getProgram(ctx:ReferralContext, id:Identifier):Promise<ReferralProgram|undefined>; }
export interface ReferralEligibilityPort { check(ctx:ReferralContext, referral:ReferralRecord):Promise<{eligible:boolean; reason?:string}>; }
export interface CommissionCalculationPort { calculate(ctx:ReferralContext, referral:ReferralRecord):Promise<Money>; }
export interface ApprovalPort { approve(ctx:ReferralContext, commissionId:Identifier):Promise<void>; }
export interface SettlementReferencePort { link(ctx:ReferralContext, commissionId:Identifier, settlementId:Identifier):Promise<void>; }
export interface PayoutReferencePort { link(ctx:ReferralContext, commissionId:Identifier, payoutId:Identifier):Promise<void>; }
export interface LedgerReferencePort { link(ctx:ReferralContext, commissionId:Identifier, ledgerId:Identifier):Promise<void>; }
export interface AuditPort { record(ctx:ReferralContext, action:string, entityId:Identifier):Promise<void>; }
export interface TelemetryPort { metric(name:string, value:number, tags?:Record<string,string>):void; }
export interface ActivationPolicy { enabled(ctx:ReferralContext, feature:string):Promise<boolean>; }

const forbidden = /(?:password|passwd|secret|private[_ -]?key|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|cvv|cvc|pan|card[_ -]?number)/i;
export function validateReferralInput(input:unknown):ReferralResult<true> {
  if (JSON.stringify(input ?? '').match(forbidden)) return {ok:false,code:'SENSITIVE_DATA',message:'Sensitive credential/payment data is not accepted.'};
  return {ok:true,value:true};
}

export function canTransitionReferral(from:ReferralStatus,to:ReferralStatus):boolean {
  const map:Record<ReferralStatus,ReferralStatus[]>={DRAFT:['ACTIVE','CANCELLED'],ACTIVE:['PAUSED','CONVERTED','EXPIRED','CANCELLED'],PAUSED:['ACTIVE','CANCELLED'],CONVERTED:['CANCELLED'],EXPIRED:[],CANCELLED:[]};
  return map[from].includes(to);
}
export function canTransitionCommission(from:CommissionStatus,to:CommissionStatus):boolean {
  const map:Record<CommissionStatus,CommissionStatus[]>={PENDING:['APPROVED','CANCELLED','REVERSED'],APPROVED:['PROCESSING','CANCELLED','REVERSED'],PROCESSING:['EARNED','CANCELLED','REVERSED'],EARNED:['REVERSED'],REVERSED:[],CANCELLED:[]};
  return map[from].includes(to);
}

export async function qualifyReferral(ctx:ReferralContext, referral:ReferralRecord, deps:{programs:ReferralProgramPort; eligibility:ReferralEligibilityPort; audit:AuditPort; telemetry:TelemetryPort; activation:ActivationPolicy}):Promise<ReferralResult<ReferralRecord>> {
  if (!(await deps.activation.enabled(ctx,'referrals'))) return {ok:false,code:'FEATURE_DISABLED',message:'Referral feature is not active for this tenant.'};
  const valid=validateReferralInput(referral); if(!valid.ok) return valid;
  const program=await deps.programs.getProgram(ctx,referral.programId); if(!program?.active) return {ok:false,code:'PROGRAM_INACTIVE',message:'Referral program is not active.'};
  const check=await deps.eligibility.check(ctx,referral); if(!check.eligible) return {ok:false,code:'NOT_ELIGIBLE',message:check.reason ?? 'Referral is not eligible.'};
  const next={...referral,status:'CONVERTED' as ReferralStatus,event:'QUALIFIED' as ReferralEvent,updatedAt:new Date().toISOString()};
  await deps.audit.record(ctx,'REFERRAL_QUALIFIED',referral.id); deps.telemetry.metric('referral.qualified',1,{tenantId:ctx.tenantId,programId:referral.programId});
  return {ok:true,value:next};
}

export function describeBoundary():string { return 'Referral/Affiliate owns attribution and commission lifecycle; Commerce owns orders, Payment owns payment state, Settlement owns reconciliation, Payout owns disbursement, Ledger owns accounting, Loyalty owns rewards.'; }
