export type MessageStatus = 'DRAFT'|'QUEUED'|'SENDING'|'SENT'|'DELIVERED'|'FAILED'|'CANCELLED'|'BOUNCED';
export type MessageKind = 'TRANSACTIONAL'|'ENGAGEMENT'|'SUPPORT'|'SYSTEM'|'CAMPAIGN'|'OTHER';
export type ChannelKind = 'EMAIL'|'SMS'|'PUSH'|'IN_APP'|'CHAT'|'WEBHOOK'|'OTHER';
export type ConversationStatus = 'OPEN'|'PENDING'|'CLOSED'|'ARCHIVED';
export type ConversationKind = 'SUPPORT'|'SALES'|'ENGAGEMENT'|'SYSTEM'|'OTHER';
export type MessageAction = 'CREATE'|'QUEUE'|'SEND'|'DELIVER'|'FAIL'|'CANCEL'|'RETRY'|'BOUNCE';

export interface MessageRecord { id:string; tenantId:string; recipientRef:string; channel:ChannelKind; kind:MessageKind; status:MessageStatus; subject?:string; body:string; templateRef?:string; correlationId?:string; createdAt:string; updatedAt:string; metadata?:Record<string,string>; }
export interface ConversationRecord { id:string; tenantId:string; participantRefs:string[]; kind:ConversationKind; status:ConversationStatus; subject?:string; createdAt:string; updatedAt:string; }
export interface MessageQuery { tenantId:string; recipientRef?:string; conversationId?:string; channel?:ChannelKind; status?:MessageStatus; limit?:number; }
export interface MessageResult { accepted:boolean; messageId?:string; reason?:string; }

export interface MessageRepository { save(record:MessageRecord):Promise<void>; findById(id:string,tenantId:string):Promise<MessageRecord|undefined>; query(query:MessageQuery):Promise<MessageRecord[]>; }
export interface ConversationRepository { save(record:ConversationRecord):Promise<void>; findById(id:string,tenantId:string):Promise<ConversationRecord|undefined>; }
export interface MessageChannelPort { send(message:MessageRecord):Promise<{accepted:boolean; providerReference?:string; reason?:string}>; }
export interface MessageValidationPort { validate(message:MessageRecord):Promise<void>; }
export interface MessageRoutingPort { resolveChannel(message:MessageRecord):Promise<ChannelKind>; }
export interface MessageTemplatePort { render(templateRef:string,context:Record<string,string>):Promise<{subject?:string;body:string}>; }
export interface MessagePreferencePort { isAllowed(tenantId:string,recipientRef:string,channel:ChannelKind,kind:MessageKind):Promise<boolean>; }
export interface MessageConsentPort { isPermitted(tenantId:string,recipientRef:string,channel:ChannelKind,kind:MessageKind):Promise<boolean>; }
export interface MessageAuditPort { record(action:MessageAction,message:MessageRecord,reason?:string):Promise<void>; }
export interface MessageTelemetryPort { metric(name:string,value:number,dimensions?:Record<string,string>):Promise<void>; }
export interface MessageActivationPolicy { isEnabled(tenantId:string,channel:ChannelKind):Promise<boolean>; }
export interface MessageEventRepository { append(event:{id:string;messageId:string;action:MessageAction;occurredAt:string;correlationId?:string}):Promise<void>; }

const SECRET_PATTERN = /(password|secret|private[_ -]?key|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|bearer|cvv|cvc|pan|card[_ -]?number)/i;
const now = () => new Date().toISOString();
export function validateSafeMetadata(metadata?:Record<string,string>):void { for (const key of Object.keys(metadata ?? {})) if (SECRET_PATTERN.test(key)) throw new Error(`Sensitive field rejected: ${key}`); }
export function validateMessageRecord(message:MessageRecord):void {
  if (!message.id || !message.tenantId || !message.recipientRef || !message.body) throw new Error('Message identity, tenant, recipient and body are required');
  if (!message.channel || !message.kind || !message.status) throw new Error('Message channel, kind and status are required');
  validateSafeMetadata(message.metadata);
  if (SECRET_PATTERN.test(message.body)) throw new Error('Potential credential/payment data rejected');
}
export function canTransition(from:MessageStatus,to:MessageStatus):boolean {
  const map:Record<MessageStatus,MessageStatus[]>={DRAFT:['QUEUED','CANCELLED'],QUEUED:['SENDING','CANCELLED'],SENDING:['SENT','DELIVERED','FAILED','BOUNCED'],SENT:['DELIVERED','FAILED','BOUNCED'],DELIVERED:[],FAILED:['QUEUED','CANCELLED'],CANCELLED:[],BOUNCED:['QUEUED','CANCELLED']};
  return map[from].includes(to);
}
export async function queueMessage(message:MessageRecord,deps:{repository:MessageRepository;validation:MessageValidationPort;audit:MessageAuditPort;telemetry:MessageTelemetryPort;events:MessageEventRepository;activation:MessageActivationPolicy}):Promise<MessageResult>{
  validateMessageRecord(message); await deps.validation.validate(message);
  if (!(await deps.activation.isEnabled(message.tenantId,message.channel))) return {accepted:false,reason:'CHANNEL_DISABLED'};
  if (message.status!=='DRAFT') return {accepted:false,reason:'INVALID_INITIAL_STATUS'};
  message.status='QUEUED'; message.updatedAt=now(); await deps.repository.save(message);
  await deps.events.append({id:`evt_${message.id}_queue`,messageId:message.id,action:'QUEUE',occurredAt:message.updatedAt,correlationId:message.correlationId});
  await deps.audit.record('QUEUE',message); await deps.telemetry.metric('message.queued',1,{channel:message.channel,kind:message.kind});
  return {accepted:true,messageId:message.id};
}
export async function sendMessage(message:MessageRecord,deps:{channel:MessageChannelPort;repository:MessageRepository;audit:MessageAuditPort;telemetry:MessageTelemetryPort;events:MessageEventRepository}):Promise<MessageResult>{
  if (!canTransition(message.status,'SENDING')) return {accepted:false,reason:'INVALID_TRANSITION'};
  message.status='SENDING'; message.updatedAt=now(); await deps.repository.save(message);
  const result=await deps.channel.send(message);
  message.status=result.accepted?'SENT':'FAILED'; message.updatedAt=now(); await deps.repository.save(message);
  const action:MessageAction=result.accepted?'SEND':'FAIL'; await deps.events.append({id:`evt_${message.id}_${action.toLowerCase()}`,messageId:message.id,action,occurredAt:message.updatedAt,correlationId:message.correlationId});
  await deps.audit.record(action,message,result.reason); await deps.telemetry.metric(result.accepted?'message.sent':'message.failed',1,{channel:message.channel});
  return {accepted:result.accepted,messageId:message.id,reason:result.reason};
}
export function describeBoundary():string { return 'Step 56 owns channel-neutral messaging, message lifecycle, routing/preferences/consent boundaries, delivery state, and conversation references; it does not own identity, support cases, notification policy, CRM, analytics, payment, or provider credentials.'; }
