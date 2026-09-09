import { DataAsset, DataProtectionProfile, DataSubjectRequest, ProtectionContext, ProtectionDecision, SecurityEvent } from './types';
export interface DataProtectionProfileRepository { getById(id: string): Promise<DataProtectionProfile | null>; save(profile: DataProtectionProfile): Promise<void>; }
export interface DataAssetRepository { getById(id: string): Promise<DataAsset | null>; save(asset: DataAsset): Promise<void>; }
export interface SecurityPolicyPort { evaluate(asset: DataAsset, context: ProtectionContext): Promise<ProtectionDecision>; }
export interface DataProtectionPort { classify(asset: DataAsset): Promise<DataProtectionProfile>; evaluate(assetId: string, context: ProtectionContext): Promise<ProtectionDecision>; }
export interface SecurityEventRepository { append(event: SecurityEvent): Promise<void>; }
export interface SecurityEventPort { record(event: SecurityEvent): Promise<void>; }
export interface DataSubjectRequestRepository { save(request: DataSubjectRequest): Promise<void>; getById(id: string): Promise<DataSubjectRequest | null>; }
export interface DataSubjectRightsPort { submit(request: DataSubjectRequest): Promise<void>; execute(request: DataSubjectRequest): Promise<void>; }
export interface SecretProtectionPort { protectSecret(reference: string): Promise<string>; resolveSecret(reference: string): Promise<string>; }
export interface SecurityAuditPort { referenceSecurityEvent(eventId: string, correlationId?: string): Promise<void>; }
