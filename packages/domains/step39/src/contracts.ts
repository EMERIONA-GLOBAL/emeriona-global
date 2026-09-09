import type { FormatRequest, FormatResult, RegionalContext, RegionProfile, RegionalPolicy } from './types';
export interface RegionalContextPort { resolve(subjectId?: string, tenantId?: string): Promise<RegionalContext>; }
export interface RegionProfileRepository { get(region: string): Promise<RegionProfile|undefined>; }
export interface RegionalPolicyRepository { get(id: string): Promise<RegionalPolicy|undefined>; }
export interface FormattingPort { format(request: FormatRequest): Promise<FormatResult>; }
export interface CurrencyContextPort { resolve(region: string, tenantId?: string): Promise<string|undefined>; }
export interface TimeZoneContextPort { resolve(region: string, tenantId?: string): Promise<string|undefined>; }
export interface RegionalValidationPort { validateContext(context: RegionalContext): Promise<void>; validatePolicy(policy: RegionalPolicy): Promise<void>; }
export interface RegionalAuditPort { record(action: string, context: RegionalContext, metadata?: Record<string, unknown>): Promise<void>; }
export interface RegionalActivationPolicy { isEnabled(context: RegionalContext): Promise<boolean>; }
