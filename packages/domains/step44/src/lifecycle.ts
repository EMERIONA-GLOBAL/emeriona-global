import { PaymentActivationPolicy, PaymentAuditPort, PaymentPort, PaymentProcessingPort, PaymentRepository, PaymentTelemetryPort, PaymentValidationPort, RefundPort } from './contracts';
import { PaymentContext, PaymentRecord, PaymentRequest, RefundRecord } from './types';
import { validateRequest, validateMoney } from './validation';

export class PaymentLifecycle {
  constructor(private readonly repo: PaymentRepository, private readonly payment: PaymentPort, private readonly processing: PaymentProcessingPort, private readonly refunds: RefundPort, private readonly validation: PaymentValidationPort, private readonly activation: PaymentActivationPolicy, private readonly audit: PaymentAuditPort, private readonly telemetry: PaymentTelemetryPort) {}
  async create(request: PaymentRequest, context: PaymentContext): Promise<PaymentRecord> {
    if (!this.activation.isEnabled(context)) throw new Error('Payment capability is not active.');
    validateRequest(request); this.validation.validateRequest(request);
    const result = await this.payment.create(request, context); await this.repo.save(result);
    await this.audit.record('PAYMENT_CREATED', result, context); await this.telemetry.record('PAYMENT_CREATED', result); return result;
  }
  async authorize(payment: PaymentRecord, context: PaymentContext): Promise<PaymentRecord> { return this.transition('PAYMENT_AUTHORIZED', payment, context, () => this.processing.authorize(payment)); }
  async capture(payment: PaymentRecord, context: PaymentContext): Promise<PaymentRecord> { return this.transition('PAYMENT_CAPTURED', payment, context, () => this.processing.capture(payment)); }
  async cancel(payment: PaymentRecord, context: PaymentContext): Promise<PaymentRecord> { return this.transition('PAYMENT_CANCELLED', payment, context, () => this.processing.cancel(payment)); }
  async refund(payment: PaymentRecord, amount: PaymentRecord['amount'], reason: string, context: PaymentContext): Promise<RefundRecord> {
    if (!this.activation.isEnabled(context)) throw new Error('Payment capability is not active.'); validateMoney(amount); if (!reason.trim()) throw new Error('Refund reason is required.');
    const result = await this.refunds.request(payment, amount, reason); await this.audit.record('REFUND_REQUESTED', payment, context); await this.telemetry.record('REFUND_REQUESTED', payment); return result;
  }
  private async transition(action: string, p: PaymentRecord, c: PaymentContext, fn: () => Promise<PaymentRecord>): Promise<PaymentRecord> {
    if (!this.activation.isEnabled(c)) throw new Error('Payment capability is not active.'); const result = await fn(); await this.repo.save(result); await this.audit.record(action, result, c); await this.telemetry.record(action, result); return result;
  }
}
