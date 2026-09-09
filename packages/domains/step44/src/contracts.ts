import { PaymentApplication, PaymentContext, PaymentId, PaymentRecord, PaymentRequest, RefundRecord } from './types';

export interface PaymentRepository { save(payment: PaymentRecord): Promise<void>; findById(id: PaymentId): Promise<PaymentRecord | null>; }
export interface PaymentApplicationRepository { save(application: PaymentApplication): Promise<void>; listByPayment(paymentId: PaymentId): Promise<PaymentApplication[]>; }
export interface RefundRepository { save(refund: RefundRecord): Promise<void>; findById(id: string): Promise<RefundRecord | null>; }
export interface PaymentPort { create(request: PaymentRequest, context: PaymentContext): Promise<PaymentRecord>; get(id: PaymentId, context: PaymentContext): Promise<PaymentRecord | null>; }
export interface PaymentProcessingPort { authorize(payment: PaymentRecord): Promise<PaymentRecord>; capture(payment: PaymentRecord): Promise<PaymentRecord>; cancel(payment: PaymentRecord): Promise<PaymentRecord>; }
export interface RefundPort { request(payment: PaymentRecord, amount: PaymentRecord['amount'], reason: string): Promise<RefundRecord>; }
export interface PaymentValidationPort { validateRequest(request: PaymentRequest): void; validateAmount(amount: PaymentRecord['amount']): void; }
export interface PaymentAuditPort { record(action: string, payment: PaymentRecord, context: PaymentContext): Promise<void>; }
export interface PaymentTelemetryPort { record(event: string, payment: PaymentRecord): Promise<void>; }
export interface PaymentActivationPolicy { isEnabled(context: PaymentContext): boolean; }
