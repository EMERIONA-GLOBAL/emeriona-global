export const AUTHORIZATION_FLOW = [
  'Access Request',
  'Subject Resolution',
  'Role / Permission Resolution',
  'Policy Evaluation',
  'Decision',
  'Audit Trace'
] as const;

export const DEFAULT_REASON_CODES = {
  ALLOWED: 'AUTHORIZED',
  DENIED: 'POLICY_DENIED',
  DISABLED: 'AUTHORIZATION_DISABLED',
  INVALID: 'INVALID_REQUEST'
} as const;
