export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
export type SignalKind = 'HEALTH_CHECK' | 'METRIC' | 'LOG' | 'TRACE' | 'ERROR' | 'ALERT';
export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type CheckKind = 'LIVENESS' | 'READINESS' | 'DEPENDENCY' | 'CUSTOM';
export type RecoveryState = 'NORMAL' | 'DEGRADED' | 'RECOVERING' | 'FAILED';
export interface HealthCheck { id: string; name: string; kind: CheckKind; status: HealthStatus; observedAt: string; latencyMs?: number; details?: Record<string, unknown>; }
export interface ReliabilityMetric { name: string; value: number; unit: string; observedAt: string; service?: string; environment?: string; }
export interface OperationalError { id: string; code: string; message: string; severity: Severity; occurredAt: string; service?: string; correlationId?: string; fingerprint?: string; metadata?: Record<string, unknown>; }
export interface TraceContext { traceId: string; spanId: string; parentSpanId?: string; sampled?: boolean; }
export interface OperationalAlert { id: string; severity: Severity; title: string; createdAt: string; status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'; source: string; correlationId?: string; }
export interface ReliabilitySnapshot { status: HealthStatus; recovery: RecoveryState; checks: HealthCheck[]; generatedAt: string; }
