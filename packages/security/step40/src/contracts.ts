import { ConsentCheckRequest, ConsentCheckResult, ConsentContext, ConsentCaptureRequest, ConsentPolicy, ConsentPolicyId, ConsentPurpose, ConsentPurposeId, ConsentRecord, ConsentSubjectId } from './types';
export interface ConsentPurposeRepository { getById(id: ConsentPurposeId): Promise<ConsentPurpose | undefined>; listActive(): Promise<ConsentPurpose[]>; }
export interface ConsentPolicyRepository { getById(id: ConsentPolicyId): Promise<ConsentPolicy | undefined>; getActive(context: ConsentContext): Promise<ConsentPolicy | undefined>; }
export interface ConsentRepository { append(record: ConsentRecord): Promise<void>; latest(subjectId: ConsentSubjectId, purposeId: ConsentPurposeId, tenantId?: string): Promise<ConsentRecord | undefined>; list(subjectId: ConsentSubjectId, tenantId?: string): Promise<ConsentRecord[]>; }
export interface ConsentContextProvider { resolve(input: ConsentContext): Promise<ConsentContext>; }
export interface ConsentPolicyPort { isRequired(purpose: ConsentPurposeId, context: ConsentContext): Promise<boolean>; }
export interface ConsentPort { capture(request: ConsentCaptureRequest): Promise<ConsentRecord>; check(request: ConsentCheckRequest): Promise<ConsentCheckResult>; withdraw(context: ConsentContext, purposeId: ConsentPurposeId, source?: ConsentCaptureRequest['source']): Promise<ConsentRecord>; }
export interface ConsentAuditPort { record(event: { action: string; subjectId: string; purposeId: string; status: string; correlationId?: string }): Promise<void>; }
export interface ConsentValidationPort { validateCapture(request: ConsentCaptureRequest): void; validatePurpose(purpose: ConsentPurpose): void; }
export interface ConsentActivationPolicy { isEnabled(context: ConsentContext): Promise<boolean>; }
export interface ConsentRightsPort { export(context: ConsentContext): Promise<ConsentRecord[]>; }
