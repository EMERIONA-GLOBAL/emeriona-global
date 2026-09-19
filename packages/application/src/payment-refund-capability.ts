import type { PaymentId, PaymentIntent, PaymentProviderPort } from "../../domains/src/index.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface RefundPaymentInput { paymentId: PaymentId; }

export class RefundPaymentHandler implements UseCaseHandler<RefundPaymentInput, PaymentIntent> {
  constructor(private readonly payments: PaymentProviderPort) {}
  async handle(request: UseCaseRequest<RefundPaymentInput>): Promise<UseCaseResponse<PaymentIntent>> {
    const paymentId = request.input.paymentId?.trim();
    if (!paymentId) throw new Error("paymentId is required");
    return {
      useCaseId: request.useCaseId,
      correlationId: request.context.correlationId,
      output: await this.payments.refund(paymentId as PaymentId),
    };
  }
}

export const PAYMENT_REFUND_APPLICATION_VERSION = "1.0.0" as const;
