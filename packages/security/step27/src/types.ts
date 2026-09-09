export type AccessDecision = 'ALLOW' | 'DENY' | 'NOT_APPLICABLE';
export type PolicyEffect = 'ALLOW' | 'DENY';
export type SubjectType = 'IDENTITY' | 'CUSTOMER_ACCOUNT' | 'SERVICE' | 'ADMIN';
export type ResourceType = 'ACCOUNT' | 'OFFERING' | 'CART' | 'CHECKOUT' | 'ORDER' | 'FULFILLMENT' | 'DELIVERY' | 'NOTIFICATION' | 'ANALYTICS' | 'AUDIT' | 'SYSTEM';

export interface AccessSubject { subjectId: string; subjectType: SubjectType; identityId?: string; customerAccountId?: string; roles?: string[]; attributes?: Record<string, string | number | boolean>; }
export interface AccessResource { resourceType: ResourceType; resourceId: string; ownerSubjectId?: string; tenantId?: string; attributes?: Record<string, string | number | boolean>; }
export interface AccessRequest { requestId: string; action: string; subject: AccessSubject; resource: AccessResource; context?: Record<string, string | number | boolean>; }
export interface AccessDecisionRecord { decisionId: string; requestId: string; decision: AccessDecision; policyIds: string[]; reasonCode: string; evaluatedAt: string; }
export interface Permission { permissionId: string; action: string; resourceType: ResourceType; description?: string; }
export interface Role { roleId: string; name: string; permissionIds: string[]; active: boolean; }
export interface Policy { policyId: string; name: string; effect: PolicyEffect; actions: string[]; resourceTypes: ResourceType[]; priority: number; active: boolean; }
