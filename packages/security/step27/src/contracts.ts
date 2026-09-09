import type { AccessDecisionRecord, AccessRequest, Permission, Policy, Role } from './types';

export interface PermissionRepository { getById(permissionId: string): Promise<Permission | null>; }
export interface RoleRepository { getById(roleId: string): Promise<Role | null>; listForSubject(subjectId: string): Promise<Role[]>; }
export interface PolicyRepository { listApplicable(request: AccessRequest): Promise<Policy[]>; }
export interface AuthorizationPort { authorize(request: AccessRequest): Promise<AccessDecisionRecord>; }
export interface AuthorizationDecisionRepository { append(record: AccessDecisionRecord): Promise<void>; }
export interface AuthorizationPolicyPort { isEnabled(): Promise<boolean>; }
export interface AuditTracePort { recordAuthorizationDecision(record: AccessDecisionRecord): Promise<void>; }
