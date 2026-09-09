export type PipelineStage='VALIDATE'|'BUILD'|'TEST'|'SECURITY'|'BOUNDARY'|'DEPENDENCY'|'PACKAGE'|'DEPLOY';
export type CheckKind='TYPECHECK'|'LINT'|'UNIT_TEST'|'INTEGRATION_TEST'|'SECURITY_SCAN'|'DEPENDENCY_SCAN'|'BOUNDARY_CHECK'|'CONTRACT_CHECK'|'BUILD'|'ARTIFACT_INTEGRITY'|'CONFIG_VALIDATION';
export type GateStatus='PENDING'|'RUNNING'|'PASSED'|'FAILED'|'BLOCKED'|'SKIPPED';
export type DeploymentDecision='ALLOW'|'BLOCK'|'REVIEW';
export interface PipelineContext{pipelineId:string;commitSha:string;branch:string;environment:'DEVELOPMENT'|'STAGING'|'PRODUCTION';correlationId:string}
export interface QualityCheck{id:string;kind:CheckKind;stage:PipelineStage;required:boolean;status:GateStatus}
export interface QualityFinding{id:string;severity:'INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';message:string;blocking:boolean}
export interface QualityGate{id:string;requiredChecks:CheckKind[];minPassRate:number;blockOnSeverity:'INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
export interface ArtifactRecord{id:string;name:string;version:string;checksum:string;integrityVerified:boolean}
const ORDER:PipelineStage[]=['VALIDATE','BUILD','TEST','SECURITY','BOUNDARY','DEPENDENCY','PACKAGE','DEPLOY'];
export function validatePipelineContext(c:PipelineContext):void{if(!c.pipelineId||!c.commitSha||!c.branch||!c.correlationId)throw new Error('Incomplete pipeline context');}
export function validateStageOrder(stages:PipelineStage[]):void{let last=-1;for(const s of stages){const i=ORDER.indexOf(s);if(i<last)throw new Error(`Invalid pipeline stage order: ${s}`);last=i;}}
function rank(s:QualityFinding['severity']):number{return {INFO:0,LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4}[s];}
export function evaluateGate(g:QualityGate,checks:QualityCheck[],findings:QualityFinding[]):DeploymentDecision{const required=checks.filter(c=>g.requiredChecks.includes(c.kind));if(required.some(c=>c.status==='FAILED'||c.status==='BLOCKED'))return 'BLOCK';if(required.some(c=>c.status!=='PASSED'))return 'REVIEW';if(findings.some(f=>f.blocking||rank(f.severity)>=rank(g.blockOnSeverity)))return 'BLOCK';const rate=required.length?required.filter(c=>c.status==='PASSED').length/required.length:0;return rate>=g.minPassRate?'ALLOW':'BLOCK';}
export function validateArtifact(a:ArtifactRecord):void{if(!a.id||!a.name||!a.version||!a.checksum||!a.integrityVerified)throw new Error('Artifact integrity must be verified before deployment');}
export const DEFAULT_GATE:QualityGate={id:'production-default',requiredChecks:['TYPECHECK','UNIT_TEST','SECURITY_SCAN','DEPENDENCY_SCAN','BOUNDARY_CHECK','CONTRACT_CHECK','BUILD','ARTIFACT_INTEGRITY'],minPassRate:1,blockOnSeverity:'HIGH'};
export const STEP_74={name:'CI/CD & Quality Gates Foundation',version:'1.0.0',providerNeutral:true} as const;
