export type Environment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
export type ConfigurationStatus = 'DRAFT' | 'VALIDATED' | 'ACTIVE' | 'DEPRECATED';
export type FeatureFlagStatus = 'OFF' | 'ON' | 'ROLLOUT' | 'PAUSED';
export type ReadinessStatus = 'UNKNOWN' | 'READY' | 'NOT_READY' | 'DEGRADED';
export interface RuntimeContext { tenantId: string; environment: Environment; service: string; version: string; correlationId: string; }
export interface ConfigurationEntry { key: string; valueRef: string; sensitive: boolean; required: boolean; environments: Environment[]; }
export interface ConfigurationSnapshot { id: string; version: string; environment: Environment; entries: ConfigurationEntry[]; status: ConfigurationStatus; createdAt: string; }
export interface FeatureFlag { key: string; status: FeatureFlagStatus; rolloutBasisPoints?: number; environments: Environment[]; }
export interface RuntimePolicy { timeoutMs: number; maxRequestBytes: number; retryLimit: number; }
export interface ReadinessCheck { name: string; status: ReadinessStatus; message?: string; }
export interface RuntimeReadiness { status: ReadinessStatus; checks: ReadinessCheck[]; }
export interface ConfigurationValidationPort { validate(snapshot: ConfigurationSnapshot, context: RuntimeContext): Promise<void>; }
export interface ConfigurationRepository { getActive(environment: Environment, service: string): Promise<ConfigurationSnapshot | undefined>; }
export interface FeatureFlagPort { isEnabled(flag: string, context: RuntimeContext): Promise<boolean>; }
export interface SecretsReferencePort { resolveReference(reference: string, context: RuntimeContext): Promise<string>; }
export interface EnvironmentIsolationPort { validate(context: RuntimeContext): Promise<void>; }
export interface RuntimeReadinessPort { check(context: RuntimeContext): Promise<RuntimeReadiness>; }
export interface RuntimeAuditPort { record(event: string, context: RuntimeContext): Promise<void>; }
export interface RuntimeTelemetryPort { record(metric: string, value: number, context: RuntimeContext): Promise<void>; }
const SENSITIVE = /password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number/i;
export function validateMetadata(metadata: Record<string, unknown>): void { for (const key of Object.keys(metadata)) if (SENSITIVE.test(key)) throw new Error(`Sensitive configuration key is prohibited: ${key}`); }
export function validateContext(context: RuntimeContext): void { if (!context.tenantId || !context.service || !context.version || !context.correlationId) throw new Error('Invalid runtime context'); }
export function validateConfiguration(snapshot: ConfigurationSnapshot, context: RuntimeContext): void { validateContext(context); if (snapshot.environment !== context.environment) throw new Error('Configuration environment mismatch'); if (!snapshot.version) throw new Error('Configuration version is required'); for (const entry of snapshot.entries) { if (!entry.key || !entry.valueRef) throw new Error('Configuration key and reference are required'); if (entry.sensitive && SENSITIVE.test(entry.key)) throw new Error(`Sensitive key must be represented by a safe reference: ${entry.key}`); if (!entry.environments.includes(context.environment)) throw new Error(`Configuration entry is not enabled for ${context.environment}: ${entry.key}`); } }
export function validateFeatureFlag(flag: FeatureFlag): void { if (!flag.key || !flag.environments.length) throw new Error('Invalid feature flag'); if (flag.rolloutBasisPoints !== undefined && (flag.rolloutBasisPoints < 0 || flag.rolloutBasisPoints > 10000)) throw new Error('Invalid rollout allocation'); }
export function validatePolicy(policy: RuntimePolicy): void { if (policy.timeoutMs <= 0 || policy.maxRequestBytes <= 0 || policy.retryLimit < 0) throw new Error('Invalid runtime policy'); }
export const STEP_73 = { name: 'Runtime Configuration & Environment Foundation', version: '1.0.0', status: 'FOUNDATION', providerNeutral: true, flow: 'Configuration Definition → Environment Isolation → Validation → Feature Flags → Runtime Policy → Readiness → Activation → Audit/Telemetry', ownership: ['runtime configuration contracts','environment isolation','feature flag boundaries','runtime policy validation','readiness contracts','safe activation boundaries'], exclusions: ['business-domain rules','customer identity source of truth','payment/accounting source of truth','analytics source of truth','audit source of truth','secret storage','provider credentials'] } as const;
