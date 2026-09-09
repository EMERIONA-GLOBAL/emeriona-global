export type AuditStatus = "PENDING" | "RUNNING" | "PASSED" | "PASSED_WITH_WARNINGS" | "FAILED";
export type FindingSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FindingKind = "BOUNDARY" | "DEPENDENCY" | "CONTRACT" | "DUPLICATE" | "SECURITY" | "SOURCE_OF_TRUTH" | "CONFIGURATION" | "REPOSITORY" | "QUALITY";
export type DependencyDirection = "UPSTREAM" | "DOWNSTREAM" | "BIDIRECTIONAL";
export type RepositoryReadiness = "NOT_READY" | "READY_WITH_WARNINGS" | "READY";

export interface ArchitectureContext {
  auditId: string;
  version: string;
  createdAt: string;
  scope: { fromStep: number; toStep: number; includeDependencies: boolean; includeSecurity: boolean };
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ArchitectureUnit {
  step: number;
  name: string;
  version: string;
  owner: string;
  sourceOfTruth?: string;
  dependencies: number[];
  ports: string[];
  events: string[];
  status?: "ACTIVE" | "FOUNDATION" | "DEPRECATED";
}

export interface DependencyEdge {
  fromStep: number;
  toStep: number;
  direction: DependencyDirection;
  contract?: string;
  reason?: string;
}

export interface SourceOfTruthRecord {
  domain: string;
  ownerStep: number;
  entity: string;
  rationale?: string;
}

export interface ArchitectureFinding {
  id: string;
  kind: FindingKind;
  severity: FindingSeverity;
  title: string;
  description: string;
  affectedSteps: number[];
  remediation?: string;
  blocking: boolean;
}

export interface BoundaryCheck {
  id: string;
  fromStep: number;
  toStep: number;
  allowed: boolean;
  contract?: string;
  notes?: string;
}

export interface SecurityCheckResult {
  checkedPatterns: string[];
  passed: boolean;
  findings: ArchitectureFinding[];
}

export interface ContractCheckResult {
  checkedContracts: string[];
  passed: boolean;
  findings: ArchitectureFinding[];
}

export interface DuplicateCheckResult {
  groups: Array<{ steps: number[]; subject: string; resolution?: string }>;
  passed: boolean;
  findings: ArchitectureFinding[];
}

export interface RepositoryPlan {
  root: string;
  directories: string[];
  packageNaming: string;
  integrationOrder: number[];
  requiredChecks: string[];
}

export interface ArchitectureAuditReport {
  context: ArchitectureContext;
  status: AuditStatus;
  readiness: RepositoryReadiness;
  unitsChecked: number;
  dependencyEdges: number;
  sourceOfTruthRecords: number;
  findings: ArchitectureFinding[];
  security: SecurityCheckResult;
  contracts: ContractCheckResult;
  duplicates: DuplicateCheckResult;
  repositoryPlan: RepositoryPlan;
  generatedAt: string;
}

export interface ArchitectureRegistryPort {
  listUnits(context: ArchitectureContext): Promise<ArchitectureUnit[]>;
  listDependencies(context: ArchitectureContext): Promise<DependencyEdge[]>;
  listSourcesOfTruth(context: ArchitectureContext): Promise<SourceOfTruthRecord[]>;
}

export interface BoundaryValidationPort {
  validate(units: ArchitectureUnit[], edges: DependencyEdge[]): Promise<BoundaryCheck[]>;
}

export interface SecurityValidationPort {
  validate(units: ArchitectureUnit[]): Promise<SecurityCheckResult>;
}

export interface ContractValidationPort {
  validate(units: ArchitectureUnit[], edges: DependencyEdge[]): Promise<ContractCheckResult>;
}

export interface DuplicateDetectionPort {
  detect(units: ArchitectureUnit[]): Promise<DuplicateCheckResult>;
}

export interface RepositoryReadinessPort {
  buildPlan(units: ArchitectureUnit[], findings: ArchitectureFinding[]): Promise<RepositoryPlan>;
}

export interface ArchitectureAuditRepository {
  save(report: ArchitectureAuditReport): Promise<void>;
  get(auditId: string): Promise<ArchitectureAuditReport | null>;
}

export interface ArchitectureAuditTelemetryPort {
  record(event: { auditId: string; status: AuditStatus; readiness: RepositoryReadiness; findingCount: number }): Promise<void>;
}

export interface ArchitectureAuditEventPort {
  publish(event: { type: "ARCHITECTURE_AUDIT_COMPLETED" | "REPOSITORY_READINESS_UPDATED"; auditId: string }): Promise<void>;
}

const SENSITIVE_PATTERNS = [
  "password", "secret", "private key", "access token", "refresh token", "api key",
  "authorization", "bearer", "cvv", "cvc", "pan", "card number"
];

export function validateMetadata(metadata: Record<string, unknown> | undefined): void {
  if (!metadata) return;
  const haystack = JSON.stringify(metadata).toLowerCase();
  for (const pattern of SENSITIVE_PATTERNS) {
    if (haystack.includes(pattern)) throw new Error(`Sensitive metadata pattern detected: ${pattern}`);
  }
}

export function validateScope(context: ArchitectureContext): void {
  if (!context.auditId.trim()) throw new Error("auditId is required");
  if (context.scope.fromStep < 1 || context.scope.toStep < context.scope.fromStep) throw new Error("Invalid audit scope");
  validateMetadata(context.metadata);
}

export function detectCircularDependencies(edges: DependencyEdge[]): number[][] {
  const graph = new Map<number, number[]>();
  for (const edge of edges) {
    const list = graph.get(edge.fromStep) ?? [];
    list.push(edge.toStep);
    graph.set(edge.fromStep, list);
  }
  const visiting = new Set<number>();
  const visited = new Set<number>();
  const cycles: number[][] = [];
  const stack: number[] = [];
  const dfs = (node: number): void => {
    if (visiting.has(node)) {
      const i = stack.indexOf(node);
      if (i >= 0) cycles.push([...stack.slice(i), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node); stack.push(node);
    for (const next of graph.get(node) ?? []) dfs(next);
    stack.pop(); visiting.delete(node); visited.add(node);
  };
  for (const node of graph.keys()) dfs(node);
  return cycles;
}

export function deriveReadiness(findings: ArchitectureFinding[]): RepositoryReadiness {
  if (findings.some((f) => f.blocking || f.severity === "CRITICAL" || f.severity === "HIGH")) return "NOT_READY";
  if (findings.some((f) => f.severity === "MEDIUM" || f.severity === "LOW")) return "READY_WITH_WARNINGS";
  return "READY";
}

export function buildRepositoryPlan(units: ArchitectureUnit[], findings: ArchitectureFinding[]): RepositoryPlan {
  const integrationOrder = [...units].sort((a, b) => a.step - b.step).map((u) => u.step);
  return {
    root: "EMERIONA-GLOBAL",
    directories: ["apps", "packages", "core", "domains", "infrastructure", "integrations", "contracts", "shared", "config", "docs", "tests"],
    packageNaming: "@emeriona-global/<domain-or-foundation>-step<NN>",
    integrationOrder,
    requiredChecks: [
      "TypeScript strict typecheck", "ZIP/package integrity", "dependency graph validation",
      "boundary validation", "contract validation", "duplicate detection", "security secret-pattern scan",
      "source-of-truth validation", "repository build/test validation"
    ].concat(findings.length ? ["resolve blocking architecture findings before production merge"] : [])
  };
}

export async function runArchitectureAudit(
  registry: ArchitectureRegistryPort,
  boundary: BoundaryValidationPort,
  security: SecurityValidationPort,
  contracts: ContractValidationPort,
  duplicates: DuplicateDetectionPort,
  repository: RepositoryReadinessPort,
  auditStore: ArchitectureAuditRepository,
  telemetry: ArchitectureAuditTelemetryPort,
  events: ArchitectureAuditEventPort,
  context: ArchitectureContext
): Promise<ArchitectureAuditReport> {
  validateScope(context);
  const units = await registry.listUnits(context);
  const edges = await registry.listDependencies(context);
  const sources = await registry.listSourcesOfTruth(context);
  const boundaries = await boundary.validate(units, edges);
  const securityResult = await security.validate(units);
  const contractResult = await contracts.validate(units, edges);
  const duplicateResult = await duplicates.detect(units);
  const findings: ArchitectureFinding[] = [
    ...boundaries.filter((x) => !x.allowed).map((x) => ({ id: x.id, kind: "BOUNDARY" as const, severity: "HIGH" as const, title: "Invalid architecture boundary", description: x.notes ?? "Boundary validation failed", affectedSteps: [x.fromStep, x.toStep], remediation: "Replace direct coupling with the owning contract/port.", blocking: true })),
    ...securityResult.findings,
    ...contractResult.findings,
    ...duplicateResult.findings,
    ...detectCircularDependencies(edges).map((cycle, i) => ({ id: `cycle-${i + 1}`, kind: "DEPENDENCY" as const, severity: "HIGH" as const, title: "Circular dependency detected", description: `Dependency cycle: ${cycle.join(" → ")}`, affectedSteps: [...new Set(cycle)], remediation: "Break the cycle through an event, port, or ownership boundary.", blocking: true }))
  ];
  const readiness = deriveReadiness(findings);
  const report: ArchitectureAuditReport = {
    context, status: readiness === "NOT_READY" ? "FAILED" : readiness === "READY_WITH_WARNINGS" ? "PASSED_WITH_WARNINGS" : "PASSED",
    readiness, unitsChecked: units.length, dependencyEdges: edges.length, sourceOfTruthRecords: sources.length,
    findings, security: securityResult, contracts: contractResult, duplicates: duplicateResult,
    repositoryPlan: await repository.buildPlan(units, findings), generatedAt: new Date().toISOString()
  };
  await auditStore.save(report);
  await telemetry.record({ auditId: context.auditId, status: report.status, readiness, findingCount: findings.length });
  await events.publish({ type: "ARCHITECTURE_AUDIT_COMPLETED", auditId: context.auditId });
  await events.publish({ type: "REPOSITORY_READINESS_UPDATED", auditId: context.auditId });
  return report;
}

export const STEP_63 = {
  name: "Architecture Audit & Repository Integration Foundation",
  version: "1.0.0",
  flow: "Architecture Registry → Boundary Validation → Dependency Analysis → Contract Validation → Security Check → Duplicate Detection → Source-of-Truth Review → Repository Readiness → Audit/Telemetry",
  ownership: [
    "cross-step architecture audit", "dependency and boundary validation", "contract readiness", "duplicate detection",
    "security readiness checks", "source-of-truth review", "repository integration planning"
  ],
  providerNeutral: true,
  sourceOfTruth: "Architecture readiness and integration assessment only; domain data remains owned by its designated domain step."
} as const;
