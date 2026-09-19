import type { PaymentId, PaymentIntent, PaymentProviderPort } from "../../domains/src/index.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface PaymentStatusInput { paymentId: PaymentId; }

export class PaymentStatusHandler implements UseCaseHandler<PaymentStatusInput, PaymentIntent> {
  constructor(private readonly payments: PaymentProviderPort) {}
  async handle(request: UseCaseRequest<PaymentStatusInput>): Promise<UseCaseResponse<PaymentIntent>> {
    const paymentId = request.input.paymentId?.trim();
    if (!paymentId) throw new Error("paymentId is required");
    return {
      useCaseId: request.useCaseId,
      correlationId: request.context.correlationId,
      output: await this.payments.status(paymentId as PaymentId),
    };
  }
}

export const PAYMENT_STATUS_APPLICATION_VERSION = "1.0.0" as const;
