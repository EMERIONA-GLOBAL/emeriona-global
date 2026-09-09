/** EMERIONA GLOBAL — Step 52: Loyalty & Rewards Foundation v1.0 */

export type ID = string;
export type ISODateTime = string;

export interface Money { amount:number; currency:string; }
export interface TenantContext { tenantId:ID; environment:'development'|'staging'|'production'; }
export interface CustomerRef { customerId:ID; }

export enum LoyaltyAccountStatus { ACTIVE='ACTIVE', SUSPENDED='SUSPENDED', CLOSED='CLOSED' }
export enum RewardStatus { PENDING='PENDING', EARNED='EARNED', RESERVED='RESERVED', REDEEMED='REDEEMED', EXPIRED='EXPIRED', REVERSED='REVERSED', CANCELLED='CANCELLED' }
export enum RewardKind { POINTS='POINTS', CREDIT='CREDIT', BENEFIT='BENEFIT', TIER_BENEFIT='TIER_BENEFIT', CUSTOM='CUSTOM' }
export enum RewardSource { ORDER='ORDER', PROMOTION='PROMOTION', REFERRAL='REFERRAL', MANUAL='MANUAL', CAMPAIGN='CAMPAIGN', SYSTEM='SYSTEM', ADJUSTMENT='ADJUSTMENT' }
export enum RewardAction { EARN='EARN', RESERVE='RESERVE', REDEEM='REDEEM', REVERSE='REVERSE', EXPIRE='EXPIRE', CANCEL='CANCEL' }
export enum LoyaltyTier { BASIC='BASIC', PLUS='PLUS', PREMIUM='PREMIUM', CUSTOM='CUSTOM' }

export interface LoyaltyAccount {
  id:ID; tenantId:ID; customer:CustomerRef; status:LoyaltyAccountStatus;
  tier:LoyaltyTier; pointsBalance:number; lifetimeEarned:number; lifetimeRedeemed:number;
  createdAt:ISODateTime; updatedAt:ISODateTime;
}
export interface RewardRecord {
  id:ID; tenantId:ID; accountId:ID; kind:RewardKind; source:RewardSource; status:RewardStatus;
  amount:number; currency?:string; points?:number; referenceId?:ID; expiresAt?:ISODateTime;
  idempotencyKey?:string; createdAt:ISODateTime; updatedAt:ISODateTime;
}
export interface LoyaltyRule { id:ID; tenantId:ID; active:boolean; tier?:LoyaltyTier; source:RewardSource; earnMultiplier?:number; pointsPerUnit?:number; }
export interface RewardRequest { tenant:TenantContext; accountId:ID; action:RewardAction; rewardId?:ID; referenceId?:ID; amount?:number; points?:number; idempotencyKey?:string; reason?:string; }
export interface RewardResult { accepted:boolean; reward?:RewardRecord; message?:string; }

export interface LoyaltyRepository {
  getAccount(tenantId:ID, accountId:ID):Promise<LoyaltyAccount|undefined>;
  saveAccount(account:LoyaltyAccount):Promise<void>;
  getReward(tenantId:ID, rewardId:ID):Promise<RewardRecord|undefined>;
  saveReward(reward:RewardRecord):Promise<void>;
}
export interface LoyaltyRulePort { resolveRule(tenant:TenantContext, account:LoyaltyAccount, source:RewardSource):Promise<LoyaltyRule|undefined>; }
export interface LoyaltyEligibilityPort { check(request:RewardRequest, account:LoyaltyAccount):Promise<{eligible:boolean; reason?:string}>; }
export interface RewardPort { execute(request:RewardRequest):Promise<RewardResult>; }
export interface RewardValidationPort { validate(request:RewardRequest):void; }
export interface LoyaltyAuditPort { record(event:{tenantId:ID; action:RewardAction; accountId:ID; rewardId?:ID; referenceId?:ID; at:ISODateTime}):Promise<void>; }
export interface LoyaltyTelemetryPort { metric(name:string, value:number, tags?:Record<string,string>):Promise<void>; }
export interface LoyaltyActivationPolicy { enabled(tenant:TenantContext):boolean; }

const SECRET_PATTERN=/(password|passwd|secret|private[_ -]?key|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function assertSafe(value:unknown):void {
  if (typeof value==='string' && SECRET_PATTERN.test(value)) throw new Error('Sensitive payment/authentication material is not permitted.');
  if (value && typeof value==='object') for (const [k,v] of Object.entries(value as Record<string,unknown>)) { if (SECRET_PATTERN.test(k)) throw new Error('Sensitive field is not permitted.'); assertSafe(v); }
}
export function validateRequest(request:RewardRequest):void {
  assertSafe(request);
  if (!request.tenant.tenantId || !request.accountId) throw new Error('tenantId and accountId are required.');
  if (request.action!=='EARN' && !request.rewardId) throw new Error('rewardId is required for this action.');
  if (request.points !== undefined && (!Number.isInteger(request.points) || request.points <= 0)) throw new Error('points must be a positive integer.');
  if (request.amount !== undefined && (!Number.isFinite(request.amount) || request.amount <= 0)) throw new Error('amount must be positive.');
}

export class LoyaltyService implements RewardPort {
  constructor(private readonly repo:LoyaltyRepository, private readonly eligibility:LoyaltyEligibilityPort, private readonly validator:RewardValidationPort, private readonly audit:LoyaltyAuditPort, private readonly telemetry:LoyaltyTelemetryPort, private readonly activation:LoyaltyActivationPolicy) {}
  async execute(request:RewardRequest):Promise<RewardResult> {
    this.validator.validate(request);
    if (!this.activation.enabled(request.tenant)) return {accepted:false,message:'Loyalty capability is not active for this tenant/environment.'};
    const account=await this.repo.getAccount(request.tenant.tenantId,request.accountId);
    if (!account || account.status!==LoyaltyAccountStatus.ACTIVE) return {accepted:false,message:'Loyalty account is unavailable.'};
    const eligible=await this.eligibility.check(request,account);
    if (!eligible.eligible) return {accepted:false,message:eligible.reason ?? 'Not eligible.'};
    const now=new Date().toISOString();
    let reward:RewardRecord|undefined=request.rewardId ? await this.repo.getReward(request.tenant.tenantId,request.rewardId) : undefined;
    if (request.action==='EARN') {
      const points=request.points ?? 0;
      reward={id:reward?.id ?? cryptoId(),tenantId:request.tenant.tenantId,accountId:account.id,kind:RewardKind.POINTS,source:RewardSource.SYSTEM,status:RewardStatus.EARNED,amount:request.amount ?? 0,points,referenceId:request.referenceId,idempotencyKey:request.idempotencyKey,createdAt:reward?.createdAt ?? now,updatedAt:now};
      account.pointsBalance += points; account.lifetimeEarned += points;
    } else {
      if (!reward) return {accepted:false,message:'Reward not found.'};
      if (request.action==='REDEEM') { if ((reward.points ?? 0)>account.pointsBalance) return {accepted:false,message:'Insufficient points.'}; account.pointsBalance -= reward.points ?? 0; account.lifetimeRedeemed += reward.points ?? 0; reward.status=RewardStatus.REDEEMED; }
      else if (request.action==='RESERVE') reward.status=RewardStatus.RESERVED;
      else if (request.action==='REVERSE') { account.pointsBalance += reward.points ?? 0; reward.status=RewardStatus.REVERSED; }
      else if (request.action==='EXPIRE') reward.status=RewardStatus.EXPIRED;
      else if (request.action==='CANCEL') reward.status=RewardStatus.CANCELLED;
      reward.updatedAt=now;
    }
    await this.repo.saveAccount(account); await this.repo.saveReward(reward);
    await this.audit.record({tenantId:request.tenant.tenantId,action:request.action,accountId:account.id,rewardId:reward.id,referenceId:request.referenceId,at:now});
    await this.telemetry.metric('loyalty.reward_action',1,{action:request.action,tenantId:request.tenant.tenantId});
    return {accepted:true,reward};
  }
}
function cryptoId():ID { return `reward_${Date.now()}_${Math.random().toString(36).slice(2,10)}`; }

export interface LoyaltyBoundaryMap {
  step22Commerce:string; step41PricingTax:string; step48RefundsAdjustments:string; step49Subscriptions:string; step50UsageEntitlements:string; step42LedgerReference:string; step43BillingReference:string; step44PaymentReference:string; step45SettlementReference:string;
}
