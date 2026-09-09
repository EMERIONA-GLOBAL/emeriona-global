import type { DecisionContext, DecisionResult, RuleDefinition, RuleStatus } from './types';
export interface RuleRepository { getById(id: string, version?: string): Promise<RuleDefinition | undefined>; listActive(context: DecisionContext): Promise<RuleDefinition[]>; save(rule: RuleDefinition): Promise<void>; }
export interface RuleActivationPort { isActive(rule: RuleDefinition, context: DecisionContext): Promise<boolean>; }
export interface RuleEvaluationPort { evaluate(rule: RuleDefinition, context: DecisionContext): Promise<boolean>; }
export interface DecisionEnginePort { decide(context: DecisionContext): Promise<DecisionResult>; }
export interface DecisionExplanationPort { explain(result: DecisionResult): Promise<Record<string, unknown>>; }
export interface DecisionAuditPort { recordDecision(result: DecisionResult, context: DecisionContext): Promise<void>; }
export interface DecisionTelemetryPort { recordEvaluation(context: DecisionContext, result: DecisionResult): Promise<void>; }
export interface RuleValidationPort { validate(rule: RuleDefinition): string[]; }
export interface RulePolicyPort { allowedStatuses(): RuleStatus[]; }
