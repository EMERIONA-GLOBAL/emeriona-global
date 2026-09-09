import { ActivationContext, ActivationDecision, ActivationState, FeatureFlag } from './types';
export function evaluateFeature(flag:FeatureFlag|undefined, context:ActivationContext, now=new Date()):ActivationDecision {
 const key=flag?.key ?? 'unknown';
 if(!flag) return {allowed:false,state:'DISABLED',flagKey:key,reason:'FLAG_NOT_FOUND',evaluatedAt:now.toISOString()};
 if(flag.environments && !flag.environments.includes(context.environment)) return {allowed:false,state:flag.state,flagKey:key,reason:'ENVIRONMENT_NOT_ALLOWED',evaluatedAt:now.toISOString()};
 if(flag.blockedSubjects?.includes(context.subjectId ?? '')) return {allowed:false,state:flag.state,flagKey:key,reason:'SUBJECT_BLOCKED',evaluatedAt:now.toISOString()};
 if(flag.allowedSubjects && flag.allowedSubjects.length && !flag.allowedSubjects.includes(context.subjectId ?? '')) return {allowed:false,state:flag.state,flagKey:key,reason:'SUBJECT_NOT_IN_ALLOWLIST',evaluatedAt:now.toISOString()};
 if(flag.state==='ENABLED') return {allowed:true,state:flag.state,flagKey:key,reason:'ENABLED',evaluatedAt:now.toISOString()};
 if(flag.state!=='ROLLOUT') return {allowed:false,state:flag.state,flagKey:key,reason:`STATE_${flag.state}`,evaluatedAt:now.toISOString()};
 const pct=Math.max(0,Math.min(100,flag.rolloutPercentage ?? 0));
 const seed=(context.subjectId ?? context.tenantId ?? 'anonymous')+'|'+key;
 let hash=0; for(let i=0;i<seed.length;i++) hash=(hash*31+seed.charCodeAt(i))>>>0;
 const bucket=hash%100;
 return {allowed:bucket<pct,state:flag.state,flagKey:key,reason:bucket<pct?'ROLLOUT_MATCH':'ROLLOUT_MISS',evaluatedAt:now.toISOString()};
}
export function normalizeState(state:ActivationState):ActivationState { return state; }
