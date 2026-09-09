/**
 * EMERIONA GLOBAL — Step 58
 * Content & Template Management Foundation
 * Provider-neutral architectural boundary.
 */

export type ID = string;
export type ISODateTime = string;

export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
export type ContentKind = 'PAGE' | 'ARTICLE' | 'ANNOUNCEMENT' | 'KNOWLEDGE' | 'COURSE_CONTENT' | 'EVENT_CONTENT' | 'CAMPAIGN_CONTENT' | 'MEDIA' | 'CUSTOM';
export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type TemplateKind = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'CHAT' | 'WEBHOOK' | 'PAGE' | 'DOCUMENT' | 'CUSTOM';
export type ContentAction = 'CREATE' | 'EDIT' | 'SUBMIT_REVIEW' | 'APPROVE' | 'PUBLISH' | 'SCHEDULE' | 'UNPUBLISH' | 'ARCHIVE' | 'RESTORE';
export type TemplateAction = 'CREATE' | 'EDIT' | 'ACTIVATE' | 'PAUSE' | 'ARCHIVE' | 'RESTORE';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
export type VersionStatus = 'DRAFT' | 'CURRENT' | 'SUPERSEDED' | 'ARCHIVED';

export interface ContentContext {
  tenantId: ID;
  locale?: string;
  region?: string;
  timezone?: string;
  actorId?: ID;
  source?: string;
}

export interface ContentRecord {
  id: ID;
  context: ContentContext;
  kind: ContentKind;
  key: string;
  title: string;
  status: ContentStatus;
  currentVersionId?: ID;
  scheduledAt?: ISODateTime;
  publishedAt?: ISODateTime;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ContentVersion {
  id: ID;
  contentId: ID;
  version: number;
  locale: string;
  body: string;
  status: VersionStatus;
  checksum?: string;
  createdBy?: ID;
  createdAt: ISODateTime;
}

export interface ContentReview {
  id: ID;
  contentId: ID;
  versionId: ID;
  status: ReviewStatus;
  reviewerId?: ID;
  note?: string;
  createdAt: ISODateTime;
}

export interface TemplateVariable {
  name: string;
  required?: boolean;
  description?: string;
  type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'URL' | 'CUSTOM';
}

export interface TemplateRecord {
  id: ID;
  context: ContentContext;
  kind: TemplateKind;
  key: string;
  name: string;
  status: TemplateStatus;
  locale?: string;
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  version?: number;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface TemplateRenderRequest {
  templateId: ID;
  variables: Record<string, unknown>;
  locale?: string;
  context: ContentContext;
}

export interface TemplateRenderResult {
  templateId: ID;
  subject?: string;
  body: string;
  locale?: string;
  version?: number;
}

export interface ContentRepository {
  create(record: ContentRecord): Promise<ContentRecord>;
  update(record: ContentRecord): Promise<ContentRecord>;
  get(id: ID, context: ContentContext): Promise<ContentRecord | null>;
  list(context: ContentContext): Promise<ContentRecord[]>;
}

export interface ContentVersionRepository {
  save(version: ContentVersion): Promise<ContentVersion>;
  get(id: ID, context: ContentContext): Promise<ContentVersion | null>;
  list(contentId: ID, context: ContentContext): Promise<ContentVersion[]>;
}

export interface ContentReviewRepository {
  save(review: ContentReview): Promise<ContentReview>;
  list(contentId: ID, context: ContentContext): Promise<ContentReview[]>;
}

export interface TemplateRepository {
  create(record: TemplateRecord): Promise<TemplateRecord>;
  update(record: TemplateRecord): Promise<TemplateRecord>;
  get(id: ID, context: ContentContext): Promise<TemplateRecord | null>;
  list(context: ContentContext): Promise<TemplateRecord[]>;
}

export interface ContentPublicationPort {
  publish(contentId: ID, versionId: ID, context: ContentContext): Promise<void>;
  unpublish(contentId: ID, context: ContentContext): Promise<void>;
}

export interface ContentSchedulingPort {
  schedule(contentId: ID, versionId: ID, at: ISODateTime, context: ContentContext): Promise<void>;
  cancel(contentId: ID, context: ContentContext): Promise<void>;
}

export interface ContentValidationPort {
  validate(record: ContentRecord, context: ContentContext): Promise<void>;
  validateVersion(version: ContentVersion, context: ContentContext): Promise<void>;
}

export interface ContentReviewPort {
  submit(contentId: ID, versionId: ID, context: ContentContext): Promise<ContentReview>;
  approve(reviewId: ID, context: ContentContext): Promise<ContentReview>;
  reject(reviewId: ID, note: string, context: ContentContext): Promise<ContentReview>;
}

export interface TemplateRenderPort {
  render(request: TemplateRenderRequest): Promise<TemplateRenderResult>;
}

export interface TemplateValidationPort {
  validate(record: TemplateRecord, context: ContentContext): Promise<void>;
  validateVariables(record: TemplateRecord, variables: Record<string, unknown>): Promise<void>;
}

export interface ContentAuditPort {
  record(action: ContentAction | TemplateAction, entityId: ID, context: ContentContext): Promise<void>;
}

export interface ContentTelemetryPort {
  record(event: string, entityId: ID, context: ContentContext): Promise<void>;
}

export interface ContentActivationPolicy {
  isEnabled(context: ContentContext): Promise<boolean>;
}

export interface ContentEventRepository {
  append(event: { id: ID; entityId: ID; action: ContentAction | TemplateAction; occurredAt: ISODateTime; context: ContentContext }): Promise<void>;
}

const SENSITIVE = /(password|passwd|secret|private.?key|access.?token|refresh.?token|api.?key|authorization|bearer|cvv|cvc|pan|card.?number)/i;

export function assertSafeMetadata(metadata?: Record<string, unknown>): void {
  if (!metadata) return;
  const scan = (value: unknown, path: string): void => {
    if (SENSITIVE.test(path)) throw new Error('Sensitive credential/payment data is not allowed in content metadata.');
    if (typeof value === 'string' && SENSITIVE.test(value)) throw new Error('Sensitive credential/payment data is not allowed in content metadata.');
    if (Array.isArray(value)) value.forEach((v, i) => scan(v, `${path}[${i}]`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => scan(v, `${path}.${k}`));
  };
  scan(metadata, 'metadata');
}

export function validateTemplateVariables(template: TemplateRecord, variables: Record<string, unknown>): void {
  for (const variable of template.variables) {
    if (variable.required && !(variable.name in variables)) {
      throw new Error(`Missing required template variable: ${variable.name}`);
    }
  }
}

export const STEP_58 = {
  name: 'Content & Template Management Foundation',
  version: '1.0.0',
  flow: 'Content/Template → Validation → Versioning/Review → Activation/Scheduling → Publication/Rendering → Audit + Telemetry',
  providerNeutral: true,
} as const;
