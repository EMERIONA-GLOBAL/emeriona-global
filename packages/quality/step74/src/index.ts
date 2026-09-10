export type GateStatus = 'PENDING'|'RUNNING'|'PASSED'|'FAILED'|'BLOCKED'|'SKIPPED';
export type PipelineStage = 'VALIDATE'|'BUILD'|'TEST'|'SECURITY'|'BOUNDARY'|'DEPENDENCY'|'PACKAGE'|'DEPLOY';
export type CheckKind = 'TYPECHECK'|'LINT'|'UNIT_TEST'|'INTEGRATION_TEST'|'SECURITY_SCAN'|'DEPENDENCY_SCAN'|'BOUNDARY_CHECK'|'CONTRACT_CHECK'|'BUILD'|'ARTIFACT_INTEGRITY'|'CONFIG_VALIDATION';
export type FindingSeverity = 'INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type Environment = 'DEVELOPMENT'|'STAGING'|'PRODUCTION';
export type DeploymentDecision = 'ALLOW'|'BLOCK'|'REVIEW';
export interface Metadata { readonly [key:string]: string|number|boolean|null|Metadata|Metadata[]; }
const SENSITIVE=/(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
export function validateMetadata(metadata: Metadata): void { for(const [k,v] of Object.entries(metadata)){ if(SENSITIVE.test(k)) throw new Error(`Sensitive metadata key rejected: ${k}`); if(v&&typeof v==='object'&&!Array.isArray(v)) validateMetadata(v as Metadata); } }
export interface PipelineContext { readonly pipelineId:string; readonly commitSha:string; readonly branch:string; readonly environment:Environment; readonly correlationId:string; readonly metadata?:Metadata; }
export interface QualityCheck { readonly id:string; readonly kind:CheckKind; readonly stage:PipelineStage; readonly required:boolean; readonly status:GateStatus; readonly message?:string; readonly durationMs?:number; }
export interface QualityFinding { readonly id:string; readonly severity:FindingSeverity; readonly kind:CheckKind; readonly message:string; readonly blocking:boolean; }
export interface QualityGate { readonly id:string; readonly name:string; readonly requiredChecks:CheckKind[]; readonly minPassRate:number; readonly blockOnSeverity:FindingSeverity; }
export interface PipelineRun { readonly id:string; readonly context:PipelineContext; readonly status:GateStatus; readonly checks:QualityCheck[]; readonly findings:QualityFinding[]; readonly decision:DeploymentDecision; readonly createdAt:string; readonly completedAt?:string; }
export interface ArtifactRecord { readonly id:string; readonly name:string; readonly version:string; readonly checksum:string; readonly integrityVerified:boolean; }
export interface DeploymentRequest { readonly pipeline:PipelineRun; readonly artifacts:ArtifactRecord[]; readonly target:Environment; }
export interface PipelineRepository { save(run:PipelineRun):Promise<void>; find(id:string):Promise<PipelineRun|undefined>; }
export interface QualityCheckRunner { run(check:QualityCheck, context:PipelineContext):Promise<QualityCheck>; }
export interface SecurityGatePort { validate(context:PipelineContext):Promise<QualityFinding[]>; }
export interface BoundaryGatePort { validate(context:PipelineContext):Promise<QualityFinding[]>; }
export interface ArtifactIntegrityPort { verify(artifact:ArtifactRecord):Promise<boolean>; }
export interface DeploymentGatePort { evaluate(request:DeploymentRequest):Promise<DeploymentDecision>; }
export interface AuditPort { record(event:{type:string;pipelineId:string;correlationId:string;metadata?:Metadata}):Promise<void>; }
export interface TelemetryPort { metric(name:string,value:number,tags?:Metadata):Promise<void>; }
export interface STEP_74_METADATA { readonly name:'CI/CD & Quality Gates Foundation'; readonly version:'1.0.0'; readonly flow:'Commit → Validate → Build → Test → Security → Architecture/Boundary → Artifact Integrity → Deployment Decision → Audit/Telemetry'; readonly providerNeutral:true; }
export const STEP_74:STEP_74_METADATA={name:'CI/CD & Quality Gates Foundation',version:'1.0.0',flow:'Commit → Validate → Build → Test → Security → Architecture/Boundary → Artifact Integrity → Deployment Decision → Audit/Telemetry',providerNeutral:true};
const ORDER:PipelineStage[]=['VALIDATE','BUILD','TEST','SECURITY','BOUNDARY','DEPENDENCY','PACKAGE','DEPLOY'];
export function validatePipelineContext(c:PipelineContext):void { if(!c.pipelineId||!c.commitSha||!c.branch||!c.correlationId) throw new Error('Incomplete pipeline context'); if(c.metadata) validateMetadata(c.metadata); }
export function evaluateGate(gate:QualityGate, checks:QualityCheck[], findings:QualityFinding[]):DeploymentDecision { const required=checks.filter(c=>gate.requiredChecks.includes(c.kind)); if(required.some(c=>c.status==='FAILED'||c.status==='BLOCKED')) return 'BLOCK'; if(required.some(c=>c.status!=='PASSED')) return 'REVIEW'; if(findings.some(f=>f.blocking||severityRank(f.severity)>=severityRank(gate.blockOnSeverity))) return 'BLOCK'; const rate=required.length?required.filter(c=>c.status==='PASSED').length/required.length:0; return rate>=gate.minPassRate?'ALLOW':'BLOCK'; }
function severityRank(s:FindingSeverity):number{return {INFO:0,LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4}[s];}
export function validateStageOrder(stages:PipelineStage[]):void { let last=-1; for(const s of stages){const i=ORDER.indexOf(s); if(i<last) throw new Error(`Invalid pipeline stage order: ${s}`); last=i;} }
export function validateArtifact(artifact:ArtifactRecord):void { if(!artifact.id||!artifact.name||!artifact.version||!artifact.checksum) throw new Error('Incomplete artifact record'); if(!artifact.integrityVerified) throw new Error('Artifact integrity must be verified before deployment'); }
export function canDeploy(request:DeploymentRequest, gate:QualityGate):DeploymentDecision { validatePipelineContext(request.pipeline.context); if(request.pipeline.decision!=='ALLOW') return request.pipeline.decision; for(const a of request.artifacts) validateArtifact(a); return evaluateGate(gate,request.pipeline.checks,request.pipeline.findings); }
export const DEFAULT_GATE:QualityGate={id:'production-default',name:'EMERIONA Production Quality Gate',requiredChecks:['TYPECHECK','UNIT_TEST','SECURITY_SCAN','DEPENDENCY_SCAN','BOUNDARY_CHECK','CONTRACT_CHECK','BUILD','ARTIFACT_INTEGRITY'],minPassRate:1,blockOnSeverity:'HIGH'};
