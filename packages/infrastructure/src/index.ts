export interface InfrastructureContext{tenantId:string;correlationId:string;requestId?:string}
export interface InfrastructureResult<T>{ok:boolean;value?:T;error?:{code:string;message:string;retryable:boolean;providerNeutral:boolean}}
export interface InfrastructureAdapter<I,O>{execute(context:InfrastructureContext,input:I):Promise<InfrastructureResult<O>>;health(context:InfrastructureContext):Promise<{status:'UNKNOWN'|'HEALTHY'|'DEGRADED'|'UNAVAILABLE';checkedAt:string;latencyMs?:number}>}
export interface AdapterRegistration{id:string;portName:string;direction:'INBOUND'|'OUTBOUND';provider?:string;version:string}
export interface AdapterRegistry{register(registration:AdapterRegistration):Promise<void>;get(id:string):Promise<AdapterRegistration|undefined>}
export const STEP_68={name:'Infrastructure & Integration Adapter Foundation',version:'1.0.0',status:'FOUNDATION',providerNeutral:true} as const;
