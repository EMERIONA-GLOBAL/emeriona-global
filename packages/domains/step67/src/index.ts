export type DomainStatus = 'PLANNED' | 'MIGRATING' | 'INTEGRATED' | 'BLOCKED' | 'ARCHIVED';
export type PackageLayer = 'CORE' | 'DOMAIN' | 'INFRASTRUCTURE' | 'INTEGRATION' | 'SHARED' | 'APP';
export type DependencyDirection = 'ALLOWED' | 'FORBIDDEN' | 'REVIEW';

export interface DomainPackage {
  id: string;
  name: string;
  packageName: string;
  sourceStep: number;
  layer: PackageLayer;
  status: DomainStatus;
  targetPath: string;
  exports: string[];
  dependencies: string[];
  owns: string[];
  doesNotOwn: string[];
  providerNeutral: boolean;
}

export interface DependencyRule { from: PackageLayer; to: PackageLayer; direction: DependencyDirection; reason: string; }
export interface IntegrationContext { repositoryId: string; tenantId?: string; correlationId: string; actorId?: string; metadata?: Record<string, unknown>; }
export interface IntegrationFinding { id: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; kind: 'BOUNDARY' | 'DUPLICATE' | 'CYCLE' | 'OWNERSHIP' | 'NAMING' | 'SECURITY'; packageId: string; message: string; }
export interface MigrationPlan { orderedPackageIds: string[]; targetRoot: string; gates: string[]; findings: IntegrationFinding[]; ready: boolean; }
export interface DomainIntegrationPort { register(pkg: DomainPackage): Promise<void>; resolve(packageName: string): Promise<DomainPackage | undefined>; }
export interface BoundaryValidationPort { validate(pkg: DomainPackage, rules: DependencyRule[]): IntegrationFinding[]; }
export interface OwnershipValidationPort { validate(packages: DomainPackage[]): IntegrationFinding[]; }
export interface DependencyValidationPort { validate(packages: DomainPackage[]): IntegrationFinding[]; }
export interface MigrationAuditPort { record(context: IntegrationContext, plan: MigrationPlan): Promise<void>; }
export interface MigrationTelemetryPort { emit(event: string, data: Record<string, unknown>): void; }

const SENSITIVE = /password|secret|private.?key|access.?token|refresh.?token|api.?key|authorization|bearer|cvv|cvc|pan|card.?number/i;
export function validateMetadata(metadata?: Record<string, unknown>): string[] { if (!metadata) return []; return Object.keys(metadata).filter(k => SENSITIVE.test(k)); }
const RULES: DependencyRule[] = [
  { from: 'DOMAIN', to: 'CORE', direction: 'ALLOWED', reason: 'Domains may depend on shared core contracts.' },
  { from: 'DOMAIN', to: 'SHARED', direction: 'ALLOWED', reason: 'Domains may consume generic shared utilities.' },
  { from: 'DOMAIN', to: 'DOMAIN', direction: 'REVIEW', reason: 'Cross-domain dependencies require explicit contracts.' },
  { from: 'CORE', to: 'DOMAIN', direction: 'FORBIDDEN', reason: 'Core must remain domain-agnostic.' },
  { from: 'SHARED', to: 'DOMAIN', direction: 'FORBIDDEN', reason: 'Shared utilities must not depend on business domains.' },
  { from: 'DOMAIN', to: 'INFRASTRUCTURE', direction: 'FORBIDDEN', reason: 'Domains depend on ports, not infrastructure implementations.' },
  { from: 'DOMAIN', to: 'INTEGRATION', direction: 'FORBIDDEN', reason: 'External providers are accessed through adapters.' },
];
export function validatePackage(pkg: DomainPackage): IntegrationFinding[] {
  const findings: IntegrationFinding[] = [];
  if (!/^@emeriona-global\/[a-z0-9-]+$/.test(pkg.packageName)) findings.push({id:`name:${pkg.id}`,severity:'MEDIUM',kind:'NAMING',packageId:pkg.id,message:'Package name violates EMERIONA naming convention.'});
  if (!pkg.targetPath.startsWith('packages/')) findings.push({id:`path:${pkg.id}`,severity:'HIGH',kind:'BOUNDARY',packageId:pkg.id,message:'Domain package must integrate under packages/.'});
  if (pkg.layer !== 'DOMAIN') findings.push({id:`layer:${pkg.id}`,severity:'HIGH',kind:'BOUNDARY',packageId:pkg.id,message:'Step 67 accepts only domain packages.'});
  if (pkg.providerNeutral !== true) findings.push({id:`provider:${pkg.id}`,severity:'HIGH',kind:'SECURITY',packageId:pkg.id,message:'Domain package must remain provider-neutral.'});
  return findings;
}
function adjacency(packages: DomainPackage[]): Map<string,string[]> { return new Map(packages.map(p => [p.packageName, p.dependencies.filter(d => packages.some(x => x.packageName === d))])); }
export function detectCycles(packages: DomainPackage[]): IntegrationFinding[] { const graph=adjacency(packages), visiting=new Set<string>(), visited=new Set<string>(), findings:IntegrationFinding[]=[]; function dfs(n:string){if(visiting.has(n)){findings.push({id:`cycle:${n}`,severity:'CRITICAL',kind:'CYCLE',packageId:n,message:'Circular domain dependency detected.'});return;} if(visited.has(n))return; visiting.add(n); for(const d of graph.get(n)??[]) dfs(d); visiting.delete(n); visited.add(n);} for(const p of packages) dfs(p.packageName); return findings; }
export function detectDuplicates(packages: DomainPackage[]): IntegrationFinding[] { const byPath=new Map<string,DomainPackage[]>(); for(const p of packages) byPath.set(p.targetPath,[...(byPath.get(p.targetPath)??[]),p]); return [...byPath.entries()].filter(([,ps])=>ps.length>1).map(([path,ps])=>({id:`duplicate:${path}`,severity:'HIGH',kind:'DUPLICATE',packageId:ps[0].id,message:`Multiple packages target ${path}.`})); }
export function validateOwnership(packages: DomainPackage[]): IntegrationFinding[] { const findings:IntegrationFinding[]=[]; const seen=new Map<string,string>(); for(const p of packages) for(const capability of p.owns){const prior=seen.get(capability); if(prior&&prior!==p.id) findings.push({id:`owner:${capability}`,severity:'HIGH',kind:'OWNERSHIP',packageId:p.id,message:`Ownership overlap for ${capability}: ${prior} and ${p.id}.`}); else seen.set(capability,p.id);} return findings; }
export function buildMigrationPlan(packages: DomainPackage[], targetRoot='packages/domains'): MigrationPlan { const findings=packages.flatMap(validatePackage).concat(detectCycles(packages),detectDuplicates(packages),validateOwnership(packages)); const graph=new Map(packages.map(p=>[p.id,p.dependencies.map(d=>packages.find(x=>x.packageName===d)?.id).filter((x):x is string=>Boolean(x))])); const visited=new Set<string>(),order:string[]=[]; function visit(id:string){if(visited.has(id))return;visited.add(id);for(const dep of graph.get(id)??[])visit(dep);order.push(id);} for(const p of packages)visit(p.id); const blocking=findings.some(f=>f.severity==='CRITICAL'||f.severity==='HIGH'); return {orderedPackageIds:order,targetRoot,gates:['boundary','ownership','dependency','security','typecheck','tests','audit'],findings,ready:!blocking}; }
export const STEP_67={name:'Domain Package Integration Foundation',version:'1.0.0',status:'FOUNDATION',flow:'Domain Registry → Boundary Validation → Ownership Validation → Dependency Graph → Migration Order → Integration Gates → Audit/Telemetry',ownership:['domain package registration','domain migration mapping','domain dependency validation','ownership collision detection','integration gates'],doesNotOwn:['customer identity','payments','accounting','analytics source of truth','audit source of truth','provider credentials','infrastructure implementations'],providerNeutral:true} as const;
