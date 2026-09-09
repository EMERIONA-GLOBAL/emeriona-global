import { ActivationContext, ActivationDecision, ConfigDefinition, ConfigValue, FeatureFlag } from './types';
export interface ConfigDefinitionRepository { get(key:string):Promise<ConfigDefinition|undefined>; }
export interface ConfigValueRepository { get(key:string, environment:ActivationContext['environment']):Promise<ConfigValue|undefined>; }
export interface FeatureFlagRepository { get(key:string):Promise<FeatureFlag|undefined>; }
export interface ConfigurationPort { get<T=unknown>(key:string, context:ActivationContext):Promise<T|undefined>; }
export interface ActivationPolicyPort { evaluate(flagKey:string, context:ActivationContext):Promise<ActivationDecision>; }
export interface ActivationContextProvider { getContext():Promise<ActivationContext>; }
export interface ConfigurationValidationPort { validate(key:string,value:unknown):Promise<void>; }
export interface ConfigurationAuditPort { record(change:{key:string; environment:ActivationContext['environment']; version:number; actorId?:string; reason?:string}):Promise<void>; }
