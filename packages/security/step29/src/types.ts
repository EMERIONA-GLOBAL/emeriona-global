export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
export type ProtectionRequirement = 'NONE' | 'STANDARD' | 'ENCRYPTED' | 'STRICT';
export type MaskingMode = 'NONE' | 'PARTIAL' | 'FULL' | 'REDACTED';
export type RetentionAction = 'RETAIN' | 'DELETE' | 'ANONYMIZE' | 'REVIEW';
export type SecurityEventType = 'ACCESS' | 'DENIED_ACCESS' | 'POLICY_CHANGE' | 'DATA_EXPORT' | 'DATA_DELETION' | 'DATA_ANONYMIZATION' | 'SUSPICIOUS_ACTIVITY' | 'CUSTOM';
export type SecurityResult = 'SUCCESS' | 'FAILURE' | 'DENIED' | 'PARTIAL';
export type DataSubjectAction = 'ACCESS' | 'CORRECTION' | 'DELETION' | 'PORTABILITY' | 'RESTRICTION' | 'ANONYMIZATION';
export interface DataProtectionProfile { id: string; classification: DataClassification; protection: ProtectionRequirement; masking: MaskingMode; retentionDays?: number; retentionAction: RetentionAction; exportAllowed: boolean; deletionAllowed: boolean; }
export interface DataAsset { id: string; name: string; domain: string; profileId: string; owner?: string; sensitive: boolean; }
export interface ProtectionContext { environment: 'development' | 'staging' | 'production'; tenantId?: string; subjectId?: string; purpose?: string; requestedAction?: string; correlationId?: string; }
export interface ProtectionDecision { allowed: boolean; classification: DataClassification; protection: ProtectionRequirement; masking: MaskingMode; reason: string; auditRequired: boolean; }
export interface SecurityEvent { id: string; type: SecurityEventType; result: SecurityResult; assetId?: string; actorId?: string; tenantId?: string; correlationId?: string; occurredAt: string; details?: Record<string, string | number | boolean>; }
export interface DataSubjectRequest { id: string; action: DataSubjectAction; subjectId: string; assetIds: string[]; requestedAt: string; reason?: string; }
