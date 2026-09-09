import type { DisputeActivationPolicy, DisputeAuditPort, DisputePort, DisputeRepository, DisputeResolutionPort, DisputeTelemetryPort, DisputeValidationPort } from './contracts';
import type { DisputeRecord, DisputeResponse, DisputeResult } from './types';
import { validateDispute, validateResponse } from './validation';
export class DisputeLifecycle implements DisputePort, DisputeResolutionPort {
  constructor(private readonly repo: DisputeRepository, private readonly validation: DisputeValidationPort, private readonly audit: DisputeAuditPort, private readonly telemetry: DisputeTelemetryPort, private readonly activation: DisputeActivationPolicy) {}
  async open(dispute: DisputeRecord): Promise<DisputeResult> {
    if (!(await this.activation.isEnabled({ tenantId: dispute.metadata?.tenantId as string | undefined }))) return { accepted: false, reason: 'DISABLED' };
    this.validation.validate(dispute); validateDispute(dispute);
    await this.repo.save(dispute); await this.audit.record('DISPUTE_OPENED', dispute); await this.telemetry.record('dispute.opened', { disputeId: dispute.id, paymentId: dispute.paymentId });
    return { accepted: true, dispute };
  }
  async respond(response: DisputeResponse): Promise<DisputeResult> {
    this.validation.validateResponse(response); validateResponse(response);
    const dispute = await this.repo.get(response.disputeId); if (!dispute) return { accepted: false, reason: 'NOT_FOUND' };
    if (dispute.status === 'CLOSED' || dispute.status === 'CANCELLED') return { accepted: false, reason: 'TERMINAL_STATE' };
    const next = response.action === 'RESPOND' || response.action === 'CONTEST' ? 'RESPONDED' : response.action === 'ACCEPT' ? 'LOST' : response.action === 'WITHDRAW' ? 'CANCELLED' : response.action === 'CLOSE' ? 'CLOSED' : dispute.status;
    const updated = { ...dispute, status: next as DisputeRecord['status'], updatedAt: response.occurredAt, closedAt: next === 'CLOSED' || next === 'CANCELLED' ? response.occurredAt : dispute.closedAt };
    await this.repo.save(updated); await this.audit.record('DISPUTE_RESPONDED', response); await this.telemetry.record('dispute.responded', { disputeId: dispute.id, action: response.action });
    return { accepted: true, dispute: updated };
  }
  async resolve(disputeId: string, status: DisputeRecord['status']): Promise<DisputeResult> {
    if (!['WON','LOST','PARTIALLY_WON','CLOSED','CANCELLED'].includes(status)) return { accepted: false, reason: 'INVALID_RESOLUTION' };
    const dispute = await this.repo.get(disputeId); if (!dispute) return { accepted: false, reason: 'NOT_FOUND' };
    const now = new Date().toISOString(); const updated = { ...dispute, status, updatedAt: now, closedAt: now };
    await this.repo.save(updated); await this.audit.record('DISPUTE_RESOLVED', updated); await this.telemetry.record('dispute.resolved', { disputeId, status });
    return { accepted: true, dispute: updated };
  }
}