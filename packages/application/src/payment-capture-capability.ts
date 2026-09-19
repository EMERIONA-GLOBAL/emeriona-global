import type { PaymentId, PaymentIntent, PaymentProviderPort } from "../../domains/src/index.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface CapturePaymentInput { paymentId: PaymentId; }
export class CapturePaymentHandler implements UseCaseHandler<CapturePaymentInput, PaymentIntent> {
  constructor(private readonly payments: PaymentProviderPort) {}
  async handle(request: UseCaseRequest<CapturePaymentInput>): Promise<UseCaseResponse<PaymentIntent>> {
    const paymentId = request.input.paymentId?.trim();
    if (!paymentId) throw new Error("paymentId is required");
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: await this.payments.capture(paymentId as PaymentId) };
  }
}
export const PAYMENT_CAPTURE_APPLICATION_VERSION = "1.0.0" as const;
