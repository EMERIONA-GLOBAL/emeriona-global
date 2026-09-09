export type Environment = 'development' | 'staging' | 'production';
export type ActivationState = 'ENABLED' | 'DISABLED' | 'ROLLOUT' | 'PAUSED';
export type ValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
export interface ConfigDefinition { key:string; valueType:ValueType; description?:string; secret?:boolean; defaultValue?:unknown; }
export interface ConfigValue { key:string; value:unknown; environment:Environment; version:number; updatedAt:string; }
export interface FeatureFlag { key:string; state:ActivationState; description?:string; rolloutPercentage?:number; allowedSubjects?:string[]; blockedSubjects?:string[]; environments?:Environment[]; }
export interface ActivationContext { environment:Environment; tenantId?:string; subjectId?:string; attributes?:Record<string,unknown>; }
export interface ActivationDecision { allowed:boolean; state:ActivationState; flagKey:string; reason:string; evaluatedAt:string; }
