import type { PaymentId, PaymentIntent, PaymentProviderPort } from "../../domains/src/index.js";
import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";

export interface AuthorizePaymentInput {
  paymentId: PaymentId;
}

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

export class AuthorizePaymentHandler implements UseCaseHandler<AuthorizePaymentInput, PaymentIntent> {
  constructor(private readonly payments: PaymentProviderPort) {}

  async handle(request: UseCaseRequest<AuthorizePaymentInput>): Promise<UseCaseResponse<PaymentIntent>> {
    const paymentId = required(request.input.paymentId, "paymentId") as PaymentId;
    const intent = await this.payments.authorize(paymentId);
    return {
      useCaseId: request.useCaseId,
      correlationId: request.context.correlationId,
      output: intent,
    };
  }
}

export const PAYMENT_AUTHORIZATION_APPLICATION_VERSION = "1.0.0" as const;
