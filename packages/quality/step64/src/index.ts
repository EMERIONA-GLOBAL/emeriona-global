export type RepositoryStatus = 'PLANNED' | 'BOOTSTRAPPING' | 'READY' | 'FROZEN' | 'ARCHIVED';
export type PackageKind = 'CORE' | 'DOMAIN' | 'INFRASTRUCTURE' | 'INTEGRATION' | 'SHARED' | 'APP' | 'DOCS' | 'TEST';
export type ValidationKind = 'TYPECHECK' | 'LINT' | 'TEST' | 'SECURITY' | 'BOUNDARY' | 'DEPENDENCY' | 'BUILD';
export type ValidationStatus = 'PENDING' | 'PASS' | 'FAIL' | 'SKIPPED';

export interface RepositoryContext {
  repositoryId: string;
  name: string;
  defaultBranch: string;
  status: RepositoryStatus;
  version: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface PackageBoundary {
  packageId: string;
  name: string;
  path: string;
  kind: PackageKind;
  owner: string;
  publicEntry: string;
  dependencies: string[];
  allowedImports: string[];
  forbiddenImports: string[];
}

export interface RepositoryValidation {
  validationId: string;
  repositoryId: string;
  kind: ValidationKind;
  status: ValidationStatus;
  command?: string;
  message?: string;
  executedAt: string;
}

export interface WorkspacePolicy {
  packageManager: 'npm' | 'pnpm' | 'yarn';
  nodeVersion: string;
  lockfileRequired: boolean;
  privatePackages: boolean;
  strictTypeScript: boolean;
  testRequired: boolean;
  securityScanRequired: boolean;
}

export interface RepositoryManifest {
  context: RepositoryContext;
  workspace: WorkspacePolicy;
  packages: PackageBoundary[];
  validations: RepositoryValidation[];
}

export interface RepositoryBootstrapPort {
  initialize(context: RepositoryContext): Promise<void>;
  registerPackage(boundary: PackageBoundary): Promise<void>;
  applyWorkspacePolicy(policy: WorkspacePolicy): Promise<void>;
}

export interface RepositoryValidationPort {
  validate(repositoryId: string, kind: ValidationKind): Promise<RepositoryValidation>;
}

export interface RepositoryAuditPort {
  record(entry: RepositoryValidation): Promise<void>;
}

export interface RepositoryTelemetryPort {
  emit(event: { repositoryId: string; name: string; timestamp: string; metadata?: Record<string, unknown> }): Promise<void>;
}

const SENSITIVE_KEYS = /password|secret|private[ _-]?key|access[ _-]?token|refresh[ _-]?token|api[ _-]?key|authorization|bearer|cvv|cvc|pan|card[ _-]?number/i;

export function validateMetadata(metadata: Record<string, unknown> | undefined): void {
  if (!metadata) return;
  for (const key of Object.keys(metadata)) {
    if (SENSITIVE_KEYS.test(key)) throw new Error(`Sensitive metadata key is not permitted: ${key}`);
  }
}

export function validatePackageBoundary(boundary: PackageBoundary): void {
  if (!boundary.packageId || !boundary.name || !boundary.path || !boundary.owner || !boundary.publicEntry) {
    throw new Error('Package boundary requires identity, path, owner and public entry.');
  }
  if (boundary.dependencies.includes(boundary.packageId)) throw new Error('Package cannot depend on itself.');
  const overlap = boundary.dependencies.filter((dep) => boundary.forbiddenImports.includes(dep));
  if (overlap.length) throw new Error(`Forbidden dependency detected: ${overlap.join(', ')}`);
}

export function validateWorkspacePolicy(policy: WorkspacePolicy): void {
  if (!policy.nodeVersion.trim()) throw new Error('Node version is required.');
  if (!policy.strictTypeScript) throw new Error('Strict TypeScript must remain enabled.');
  if (!policy.lockfileRequired) throw new Error('A lockfile is required for reproducible builds.');
}

export function detectDuplicatePackages(packages: PackageBoundary[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of packages) {
    if (seen.has(item.name)) duplicates.push(item.name); else seen.add(item.name);
  }
  return duplicates;
}

export function validateManifest(manifest: RepositoryManifest): void {
  validateMetadata(manifest.context.metadata);
  validateWorkspacePolicy(manifest.workspace);
  manifest.packages.forEach(validatePackageBoundary);
  const duplicates = detectDuplicatePackages(manifest.packages);
  if (duplicates.length) throw new Error(`Duplicate package names: ${duplicates.join(', ')}`);
  if (!manifest.context.defaultBranch.trim()) throw new Error('Default branch is required.');
}

export const STEP_64 = {
  name: 'Repository Bootstrap & Monorepo Foundation',
  version: '1.0.0',
  status: 'FOUNDATION',
  flow: 'Repository Definition → Workspace Policy → Package Boundaries → Shared Contracts → Validation Gates → CI Readiness → Repository Ready',
  ownership: [
    'repository bootstrap',
    'monorepo/workspace policy',
    'package boundary registry',
    'shared repository conventions',
    'validation gates',
    'CI readiness'
  ],
  doesNotOwn: [
    'business domain source of truth',
    'customer identity',
    'payments or accounting',
    'analytics source of truth',
    'audit source of truth',
    'external provider credentials'
  ],
  providerNeutral: true
} as const;
