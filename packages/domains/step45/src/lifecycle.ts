import { SettlementAuditPort, SettlementPort, SettlementRepository, SettlementTelemetryPort, SettlementActivationPolicy, SettlementValidationPort } from './contracts';
import { SettlementRecord, SettlementResult } from './types';
import { validateSettlement } from './validation';

export class SettlementLifecycle {
  constructor(private repo: SettlementRepository, private port: SettlementPort, private audit: SettlementAuditPort, private telemetry: SettlementTelemetryPort, private activation: SettlementActivationPolicy, private validation: SettlementValidationPort = { validate: validateSettlement }) {}
  async settle(record: SettlementRecord): Promise<SettlementResult> {
    if (!(await this.activation.isEnabled(record.context?.tenantId))) throw new Error('Settlement is disabled');
    this.validation.validate(record);
    const result = await this.port.settle(record);
    await this.repo.save(result.settlement);
    await this.audit.record('SETTLE', record.id, { status: result.status });
    await this.telemetry.measure('settlement.completed', 1, { status: result.status });
    return result;
  }
  async reverse(id: string, reason: string): Promise<SettlementResult> {
    if (!reason.trim()) throw new Error('Reversal reason is required');
    const result = await this.port.reverse(id, reason);
    await this.repo.save(result.settlement);
    await this.audit.record('REVERSE', id, { status: result.status });
    await this.telemetry.measure('settlement.reversed', 1, { status: result.status });
    return result;
  }
}
