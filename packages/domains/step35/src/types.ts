export type RuleStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'RETIRED';
export type RuleEffect = 'ALLOW' | 'DENY' | 'ROUTE' | 'TRANSFORM' | 'TRIGGER' | 'CUSTOM';
export type RuleOperator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EXISTS' | 'NOT_EXISTS';
export type LogicalOperator = 'AND' | 'OR';
export type DecisionStatus = 'DECIDED' | 'NO_MATCH' | 'REJECTED' | 'ERROR';
export type RuleSource = 'SYSTEM' | 'ADMIN' | 'MODULE' | 'API' | 'IMPORTED' | 'CUSTOM';
export type RuleVersion = `v${number}`;
export interface RuleCondition { field: string; operator: RuleOperator; value?: unknown; }
export interface RuleGroup { operator: LogicalOperator; conditions: RuleCondition[]; groups?: RuleGroup[]; }
export interface RuleAction { type: string; parameters?: Record<string, unknown>; }
export interface RuleDefinition { id: string; name: string; version: RuleVersion; status: RuleStatus; priority: number; effect: RuleEffect; source: RuleSource; condition: RuleGroup; actions: RuleAction[]; effectiveFrom?: string; effectiveUntil?: string; activationKey?: string; metadata?: Record<string, unknown>; }
export interface DecisionContext { requestId: string; subjectId?: string; tenantId?: string; resourceType?: string; resourceId?: string; attributes: Record<string, unknown>; timestamp: string; correlationId?: string; causationId?: string; }
export interface DecisionTrace { ruleId: string; ruleVersion: RuleVersion; matched: boolean; priority: number; reason?: string; }
export interface DecisionResult { status: DecisionStatus; effect?: RuleEffect; actions: RuleAction[]; ruleId?: string; ruleVersion?: RuleVersion; traces: DecisionTrace[]; evaluatedAt: string; }
