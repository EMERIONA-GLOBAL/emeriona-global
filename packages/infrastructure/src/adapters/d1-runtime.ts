import type { AuditPort, IdempotencyPort } from "../../../application/src/ports.js";
import type { UseCaseContext, UseCaseResponse } from "../../../application/src/index.js";
import type { D1DatabaseLike } from "../d1.js";
interface Row extends Record<string, unknown> { response_json?: string|null; idempotency_key?: string; }
export class D1IdempotencyAdapter implements IdempotencyPort {
  constructor(private readonly db:D1DatabaseLike){}
  private async rows<T extends Row>(sql:string,values:readonly unknown[]=[]):Promise<T[]>{const statement=this.db.prepare(sql);const bound=values.length?statement.bind(...values):statement;return (await bound.all<T>()).results;}
  async acquire(key:string,context:UseCaseContext):Promise<boolean>{const rows=await this.rows("INSERT OR IGNORE INTO idempotency_records (tenant_id,idempotency_key,use_case_id,correlation_id,status) VALUES (?,?,?,?, 'IN_PROGRESS') RETURNING idempotency_key",[context.tenantId,key,context.metadata?.useCaseId??"unknown",context.correlationId]);return rows.length>0;}
  async getResult<T>(key:string,context:UseCaseContext):Promise<UseCaseResponse<T>|undefined>{const rows=await this.rows<Row>("SELECT response_json FROM idempotency_records WHERE tenant_id=? AND idempotency_key=? AND status='COMPLETED'",[context.tenantId,key]);if(!rows[0]?.response_json)return undefined;return JSON.parse(rows[0].response_json) as UseCaseResponse<T>;}
  async storeResult<T>(key:string,context:UseCaseContext,response:UseCaseResponse<T>):Promise<void>{await this.rows("UPDATE idempotency_records SET status='COMPLETED',response_json=?,updated_at=CURRENT_TIMESTAMP WHERE tenant_id=? AND idempotency_key=?",[JSON.stringify(response),context.tenantId,key]);}
}
export class D1AuditAdapter implements AuditPort { constructor(private readonly db:D1DatabaseLike,private readonly tenantId:string){} async record(event:Parameters<AuditPort["record"]>[0]):Promise<void>{await this.db.prepare("INSERT INTO audit_events (id,tenant_id,use_case_id,correlation_id,outcome,metadata_json) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),this.tenantId,event.useCaseId,event.correlationId,event.outcome,event.metadata?JSON.stringify(event.metadata):null).all();} }
export const D1_RUNTIME_ADAPTERS_VERSION="1.0.2" as const;
