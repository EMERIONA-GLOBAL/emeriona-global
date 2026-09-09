export type Environment='DEVELOPMENT'|'STAGING'|'PRODUCTION';
export interface RuntimeContext{tenantId:string;service:string;environment:Environment;version:string;correlationId:string}
export interface ConfigurationEntry{key:string;valueRef:string;sensitive:boolean;environments:Environment[]}
export interface ConfigurationSnapshot{environment:Environment;service:string;version:string;entries:ConfigurationEntry[];status:'DRAFT'|'ACTIVE'|'RETIRED'}
export interface FeatureFlag{key:string;status:'ENABLED'|'DISABLED'|'ROLLOUT';rolloutBasisPoints?:number;environments:Environment[]}
export interface RuntimePolicy{timeoutMs:number;maxRequestBytes:number;retryLimit:number}
export function validateContext(c:RuntimeContext):void{if(!c.tenantId||!c.service||!c.version||!c.correlationId)throw new Error('Invalid runtime context');}
export function validateConfiguration(s:ConfigurationSnapshot,c:RuntimeContext):void{validateContext(c);if(s.environment!==c.environment||s.service!==c.service)throw new Error('Configuration context mismatch');for(const e of s.entries){if(!e.key||!e.valueRef)throw new Error('Configuration key and reference are required');if(!e.environments.includes(c.environment))throw new Error(`Configuration entry is not enabled for ${c.environment}: ${e.key}`);}}
export function validateFeatureFlag(f:FeatureFlag):void{if(!f.key||!f.environments.length)throw new Error('Invalid feature flag');if(f.rolloutBasisPoints!==undefined&&(f.rolloutBasisPoints<0||f.rolloutBasisPoints>10000))throw new Error('Invalid rollout allocation');}
export function validatePolicy(p:RuntimePolicy):void{if(p.timeoutMs<=0||p.maxRequestBytes<=0||p.retryLimit<0)throw new Error('Invalid runtime policy');}
export const STEP_73={name:'Runtime Configuration & Environment Foundation',version:'1.0.0',status:'FOUNDATION',providerNeutral:true} as const;
