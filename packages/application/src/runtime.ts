import type { AuditPort, AuthorizationPort, IdempotencyPort, TelemetryPort } from "./ports.js";
import { type UseCaseContext, type UseCaseHandler, type UseCaseRequest, type UseCaseResponse, validateRequest } from "./index.js";
export interface UseCaseRuntimeDependencies { authorization:AuthorizationPort; idempotency?:IdempotencyPort; audit?:AuditPort; telemetry?:TelemetryPort; transaction?:{run<T>(work:()=>Promise<T>):Promise<T>}; }
export interface UseCaseRuntime { execute<T,R>(handler:UseCaseHandler<T,R>,request:UseCaseRequest<T>):Promise<UseCaseResponse<R>>; }
function errorMessage(error:unknown):string{return error instanceof Error?error.message:"Use case execution failed";}
async function recordAudit(audit:AuditPort|undefined,request:UseCaseRequest<unknown>,outcome:"STARTED"|"SUCCEEDED"|"FAILED"):Promise<void>{if(!audit)return;await audit.record({useCaseId:request.useCaseId,correlationId:request.context.correlationId,outcome});}
export class DefaultUseCaseRuntime implements UseCaseRuntime{
 constructor(private readonly dependencies:UseCaseRuntimeDependencies){}
 async execute<T,R>(handler:UseCaseHandler<T,R>,request:UseCaseRequest<T>):Promise<UseCaseResponse<R>>{
  validateRequest(request);
  const authorized=await this.dependencies.authorization.authorize(request.context,request.useCaseId);if(!authorized)throw new Error(`Use case not authorized: ${request.useCaseId}`);
  const idempotency=this.dependencies.idempotency;const idempotencyContext:UseCaseContext={...request.context,metadata:{...request.context.metadata,useCaseId:request.useCaseId}};
  if(idempotency&&request.idempotencyKey){const existing=await idempotency.getResult<R>(request.idempotencyKey,idempotencyContext);if(existing)return existing;const acquired=await idempotency.acquire(request.idempotencyKey,idempotencyContext);if(!acquired){const result=await idempotency.getResult<R>(request.idempotencyKey,idempotencyContext);if(result)return result;throw new Error("Idempotency key is already in progress");}}
  const startedAt=Date.now();try{await recordAudit(this.dependencies.audit,request,"STARTED");const executeHandler=()=>handler.handle(request);const response=this.dependencies.transaction?await this.dependencies.transaction.run(executeHandler):await executeHandler();if(idempotency&&request.idempotencyKey)await idempotency.storeResult(request.idempotencyKey,idempotencyContext,response);await recordAudit(this.dependencies.audit,request,"SUCCEEDED");await this.dependencies.telemetry?.record({useCaseId:request.useCaseId,correlationId:request.context.correlationId,durationMs:Date.now()-startedAt,outcome:"SUCCEEDED"});return response;}catch(error){try{await recordAudit(this.dependencies.audit,request,"FAILED");await this.dependencies.telemetry?.record({useCaseId:request.useCaseId,correlationId:request.context.correlationId,durationMs:Date.now()-startedAt,outcome:"FAILED"});}catch{}throw new Error(errorMessage(error));}
 }
}
export const APPLICATION_RUNTIME_VERSION="1.1.0" as const;
