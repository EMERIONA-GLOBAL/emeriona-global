export type RepositoryArea =
  | 'apps'
  | 'packages/core'
  | 'packages/domains'
  | 'packages/infrastructure'
  | 'packages/integrations'
  | 'packages/shared'
  | 'contracts'
  | 'config'
  | 'docs'
  | 'tests';

export type MigrationStatus = 'PLANNED' | 'READY' | 'MIGRATED' | 'VALIDATED' | 'BLOCKED' | 'DEPRECATED';
export type PackageKind = 'DOMAIN' | 'CORE' | 'INFRASTRUCTURE' | 'INTEGRATION' | 'SHARED' | 'CONTRACT' | 'APP';

export interface RepositoryContext {
  repositoryId: string;
  repositoryVersion: string;
  tenantId?: string;
  environment: 'development' | 'staging' | 'production';
}

export interface PackageMigrationRecord {
  step: number;
  packageName: string;
  version: string;
  kind: PackageKind;
  targetArea: RepositoryArea;
  sourcePath: string;
  targetPath: string;
  dependencies: number[];
  status: MigrationStatus;
  sourceOfTruth?: boolean;
  notes?: string[];
}

export interface MigrationManifest {
  manifestId: string;
  generatedAt: string;
  repository: RepositoryContext;
  records: PackageMigrationRecord[];
}

export interface IntegrationIssue {
  code:
    | 'DUPLICATE_TARGET'
    | 'INVALID_STEP'
    | 'INVALID_TARGET'
    | 'SELF_DEPENDENCY'
    | 'MISSING_DEPENDENCY'
    | 'DEPENDENCY_CYCLE'
    | 'INVALID_SOURCE_PATH'
    | 'INVALID_PACKAGE_NAME';
  step?: number;
  message: string;
}

export interface MigrationValidationResult {
  valid: boolean;
  issues: IntegrationIssue[];
  migrated: number;
  ready: number;
  blocked: number;
}

export interface PackageMigrationRepository {
  getManifest(): Promise<MigrationManifest>;
  saveManifest(manifest: MigrationManifest): Promise<void>;
  update(record: PackageMigrationRecord): Promise<void>;
}

export interface PackageValidator {
  validate(record: PackageMigrationRecord): Promise<IntegrationIssue[]>;
}

export interface RepositoryAuditPort {
  record(event: { action: string; step: number; status: MigrationStatus; at: string }): Promise<void>;
}

export interface RepositoryTelemetryPort {
  measure(metric: string, value: number, tags?: Record<string, string>): Promise<void>;
}

const TARGET_AREAS: RepositoryArea[] = [
  'apps',
  'packages/core',
  'packages/domains',
  'packages/infrastructure',
  'packages/integrations',
  'packages/shared',
  'contracts',
  'config',
  'docs',
  'tests'
];

const PACKAGE_NAME = /^@emeriona-global\/[a-z0-9]+(?:-[a-z0-9]+)*-step\d+$/;

function validateRecord(record: PackageMigrationRecord): IntegrationIssue[] {
  const issues: IntegrationIssue[] = [];
  if (!Number.isInteger(record.step) || record.step < 1) {
    issues.push({ code: 'INVALID_STEP', step: record.step, message: 'Step must be a positive integer.' });
  }
  if (!PACKAGE_NAME.test(record.packageName)) {
    issues.push({ code: 'INVALID_PACKAGE_NAME', step: record.step, message: `Invalid package name: ${record.packageName}` });
  }
  if (!TARGET_AREAS.includes(record.targetArea)) {
    issues.push({ code: 'INVALID_TARGET', step: record.step, message: `Invalid target area: ${record.targetArea}` });
  }
  if (!record.sourcePath.trim() || !record.targetPath.trim()) {
    issues.push({ code: 'INVALID_SOURCE_PATH', step: record.step, message: 'Source and target paths are required.' });
  }
  if (record.dependencies.includes(record.step)) {
    issues.push({ code: 'SELF_DEPENDENCY', step: record.step, message: 'A package cannot depend on itself.' });
  }
  for (const dependency of record.dependencies) {
    if (!Number.isInteger(dependency) || dependency < 1) {
      issues.push({ code: 'MISSING_DEPENDENCY', step: record.step, message: `Invalid dependency reference: ${dependency}` });
    }
  }
  return issues;
}

function detectDuplicateTargets(records: PackageMigrationRecord[]): IntegrationIssue[] {
  const seen = new Map<string, number>();
  const issues: IntegrationIssue[] = [];
  for (const record of records) {
    const previous = seen.get(record.targetPath);
    if (previous !== undefined) {
      issues.push({ code: 'DUPLICATE_TARGET', step: record.step, message: `Target path is already assigned to Step ${previous}: ${record.targetPath}` });
    } else {
      seen.set(record.targetPath, record.step);
    }
  }
  return issues;
}

function detectCycles(records: PackageMigrationRecord[]): IntegrationIssue[] {
  const graph = new Map<number, number[]>();
  const existing = new Set(records.map((r) => r.step));
  const issues: IntegrationIssue[] = [];
  for (const record of records) graph.set(record.step, record.dependencies.filter((d) => existing.has(d)));

  const visiting = new Set<number>();
  const visited = new Set<number>();
  const walk = (step: number, stack: number[]): void => {
    if (visiting.has(step)) {
      const cycle = [...stack, step].join(' → ');
      issues.push({ code: 'DEPENDENCY_CYCLE', step, message: `Dependency cycle detected: ${cycle}` });
      return;
    }
    if (visited.has(step)) return;
    visiting.add(step);
    for (const dependency of graph.get(step) ?? []) walk(dependency, [...stack, step]);
    visiting.delete(step);
    visited.add(step);
  };
  for (const step of graph.keys()) walk(step, []);
  return issues;
}

export function validateMigrationManifest(manifest: MigrationManifest): MigrationValidationResult {
  const issues = manifest.records.flatMap(validateRecord);
  issues.push(...detectDuplicateTargets(manifest.records));
  issues.push(...detectCycles(manifest.records));
  const migrated = manifest.records.filter((r) => r.status === 'MIGRATED' || r.status === 'VALIDATED').length;
  const ready = manifest.records.filter((r) => r.status === 'READY').length;
  const blocked = manifest.records.filter((r) => r.status === 'BLOCKED').length;
  return { valid: issues.length === 0, issues, migrated, ready, blocked };
}

export function buildMigrationPlan(records: PackageMigrationRecord[]): PackageMigrationRecord[] {
  const byStep = new Map(records.map((r) => [r.step, r]));
  return [...records].sort((a, b) => {
    const aDepth = dependencyDepth(a, byStep, new Set());
    const bDepth = dependencyDepth(b, byStep, new Set());
    return aDepth - bDepth || a.step - b.step;
  });
}

function dependencyDepth(record: PackageMigrationRecord, byStep: Map<number, PackageMigrationRecord>, seen: Set<number>): number {
  if (seen.has(record.step)) return 0;
  seen.add(record.step);
  let depth = 0;
  for (const dependency of record.dependencies) {
    const parent = byStep.get(dependency);
    if (parent) depth = Math.max(depth, 1 + dependencyDepth(parent, byStep, new Set(seen)));
  }
  return depth;
}

export const STEP_65 = {
  step: 65,
  name: 'Repository Integration & Package Migration Foundation',
  version: '1.0.0',
  flow: 'Package Inventory → Classification → Target Mapping → Dependency Validation → Migration Plan → Repository Validation → Audit/Telemetry',
  providerNeutral: true,
  ownership: [
    'repository package migration contracts',
    'target-area mapping',
    'dependency and cycle validation',
    'migration ordering',
    'repository integration readiness'
  ],
  doesNotOwn: [
    'business-domain source of truth',
    'customer identity',
    'accounting ledger',
    'analytics source of truth',
    'audit source of truth',
    'external provider credentials'
  ] as const
};

export const REPOSITORY_TEMPLATE = {
  areas: TARGET_AREAS,
  rules: [
    'Each migrated package keeps one clear owner.',
    'Domain packages do not import provider SDKs directly.',
    'Shared packages remain dependency-light.',
    'Contracts are explicit integration boundaries.',
    'No secrets or regulated payment data are committed.',
    'Migration is dependency-aware and reversible.'
  ]
};
