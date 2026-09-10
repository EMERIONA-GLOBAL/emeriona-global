export type AdapterStatus = 'REGISTERED'|'ACTIVE'|'PAUSED'|'DEPRECATED'|'RETIRED';
export type AdapterKind = 'DATABASE'|'CACHE'|'STORAGE'|'MESSAGING'|'PAYMENT'|'SEARCH'|'ANALYTICS'|'AI'|'HTTP'|'CUSTOM';
export type PortDirection = 'OUTBOUND'|'INBOUND';
export type HealthStatus = 'UNKNOWN'|'HEALTHY'|'DEGRADED'|'UNAVAILABLE';

export interface IntegrationContext { tenantId: string; correlationId: string; requestId?: string; locale?: string; region?: string; }
export interface AdapterMetadata { name: string; version: string; kind: AdapterKind; status: AdapterStatus; provider?: string; capabilities: string[]; metadata?: Record<string, unknown>; }
export interface AdapterRegistration { adapterId: string; portName: string; direction: PortDirection; metadata: AdapterMetadata; }
export interface AdapterHealth { adapterId: string; status: HealthStatus; checkedAt: string; latencyMs?: number; details?: Record<string, unknown>; }
export interface AdapterOperation<TInput,TOutput> { context: IntegrationContext; operation: string; input: TInput; }
export interface AdapterResult<T> { ok: boolean; value?: T; error?: IntegrationError; }
export interface IntegrationError { code: string; message: string; retryable: boolean; providerNeutral: boolean; details?: Record<string, unknown>; }

export interface InfrastructureAdapterPort<TInput,TOutput> { execute(operation: AdapterOperation<TInput,TOutput>): Promise<AdapterResult<TOutput>>; health(context: IntegrationContext): Promise<AdapterHealth>; }
export interface AdapterRegistryPort { register(registration: AdapterRegistration): Promise<void>; get(adapterId: string): Promise<AdapterRegistration|undefined>; list(kind?: AdapterKind): Promise<AdapterRegistration[]>; }
export interface AdapterFactoryPort { create<TInput,TOutput>(registration: AdapterRegistration): InfrastructureAdapterPort<TInput,TOutput>; }
export interface AdapterHealthPort { check(adapterId: string, context: IntegrationContext): Promise<AdapterHealth>; }
export interface RetryPolicyPort { shouldRetry(error: IntegrationError, attempt: number): boolean; nextDelayMs(attempt: number): number; }
export interface IntegrationSecurityPort { validateContext(context: IntegrationContext): void; validateMetadata(metadata?: Record<string, unknown>): void; }
export interface IntegrationAuditPort { record(event: { adapterId: string; operation: string; correlationId: string; outcome: 'SUCCESS'|'FAILURE'; timestamp: string }): Promise<void>; }
export interface IntegrationTelemetryPort { metric(name: string, value: number, tags?: Record<string,string>): void; }

const SENSITIVE = /(password|secret|private.?key|access.?token|refresh.?token|api.?key|authorization|bearer|cvv|cvc|pan|card.?number)/i;
export function validateMetadata(metadata?: Record<string, unknown>): void {
  if (!metadata) return;
  for (const key of Object.keys(metadata)) if (SENSITIVE.test(key)) throw new Error(`Sensitive metadata key is not permitted: ${key}`);
}
export function validateContext(context: IntegrationContext): void {
  if (!context.tenantId || !context.correlationId) throw new Error('tenantId and correlationId are required');
}
export function validateRegistration(reg: AdapterRegistration): void {
  if (!reg.adapterId || !reg.portName || !reg.metadata.name || !reg.metadata.version) throw new Error('Invalid adapter registration');
  validateMetadata(reg.metadata.metadata);
  if (reg.metadata.provider && SENSITIVE.test(reg.metadata.provider)) throw new Error('Invalid provider metadata');
}

export const STEP_68 = {
  name:'Infrastructure & Integration Adapter Foundation', version:'1.0.0', status:'FOUNDATION', providerNeutral:true,
  flow:'Domain Port → Adapter Registry → Infrastructure Adapter → External Provider/System → Normalized Result → Audit/Telemetry',
  ownership:['adapter registry','adapter lifecycle','port-to-adapter binding','health boundaries','retry policy contracts','integration security/audit/telemetry boundaries'],
  exclusions:['business-domain ownership','customer identity source of truth','payment/accounting source of truth','analytics source of truth','audit source of truth','provider credentials and secrets']
} as const;
