# Foundation Ownership Matrix

| Layer | Canonical responsibilities |
|---|---|
| core | identity primitives, results, errors, context, contracts, events |
| shared | reusable non-domain utilities |
| domains | business capabilities from Steps 13–62, grouped by bounded context |
| application | use cases, dispatch, transaction/idempotency boundaries |
| delivery | API request/response and route contracts |
| gateway | edge routing, auth delegation, rate/timeout policy |
| security | identity, authorization, revocation, data protection |
| runtime | environment isolation, feature flags, readiness, safe activation |
| infrastructure | persistence, queues, caches, technical adapters |
| integrations | external/provider adapters and normalized results |
| quality | CI/CD, typecheck, tests, security, dependency, boundary and contract gates |

## Special ownership decisions
- Step 33: canonical Workflow & Orchestration.
- Step 34 v1.1: Workflow Reliability & Long-Running Execution Extension only.
- Step 63–65: governance and repository integration controls, not business domains.
- Financial capabilities (41–53) remain domain-owned; infrastructure must not contain accounting/business decisions.
