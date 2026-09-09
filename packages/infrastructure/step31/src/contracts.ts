import { HealthCheck, ReliabilityMetric, OperationalError, TraceContext, OperationalAlert, ReliabilitySnapshot } from './types';
export interface HealthCheckPort { run(checkId: string): Promise<HealthCheck>; }
export interface HealthRepository { save(check: HealthCheck): Promise<void>; latest(checkId: string): Promise<HealthCheck | undefined>; }
export interface MetricsPort { record(metric: ReliabilityMetric): Promise<void>; }
export interface ErrorRepository { record(error: OperationalError): Promise<void>; }
export interface TracePort { start(context: TraceContext): Promise<void>; finish(context: TraceContext, durationMs: number): Promise<void>; }
export interface AlertPort { publish(alert: OperationalAlert): Promise<void>; resolve(alertId: string): Promise<void>; }
export interface ReliabilityQueryPort { snapshot(scope?: string): Promise<ReliabilitySnapshot>; }
export interface RecoveryPort { mark(state: ReliabilitySnapshot['recovery']): Promise<void>; }
export interface ReliabilityActivationPolicy { enabled(environment: string): boolean; }
export interface ReliabilityAuditPort { record(action: string, subject: string, correlationId?: string): Promise<void>; }
