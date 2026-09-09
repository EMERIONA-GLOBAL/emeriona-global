import { Invoice } from './types';
const SECRET = /(password|passwd|token|secret|api[_-]?key|private[_-]?key|cvv|cvc|card[_-]?number)/i;
export function validateInvoice(invoice: Invoice): void {
  if (!invoice.id || !invoice.customerId || !invoice.invoiceNumber) throw new Error('Invoice identity is required');
  if (!invoice.currency || invoice.currency.length !== 3) throw new Error('Invoice currency must be a 3-letter code');
  if (!invoice.lines.length) throw new Error('Invoice must contain at least one line');
  if (invoice.lines.some(l => l.quantity <= 0 || l.unitPrice.amount < 0 || l.subtotal.amount < 0 || l.taxAmount.amount < 0 || l.total.amount < 0)) throw new Error('Invoice line amounts are invalid');
  for (const l of invoice.lines) if (SECRET.test(`${l.description} ${l.offeringReference ?? ''}`)) throw new Error('Secret-like material is not allowed in invoice data');
  if (SECRET.test(invoice.invoiceNumber)) throw new Error('Secret-like material is not allowed in invoice identifiers');
  const expected = invoice.total.amount - invoice.amountPaid.amount;
  if (Math.abs(expected - invoice.amountDue.amount) > 0.000001) throw new Error('Invoice amount due is inconsistent');
  if (invoice.amountPaid.amount < 0 || invoice.amountPaid.amount > invoice.total.amount + 0.000001) throw new Error('Invoice paid amount is invalid');
}