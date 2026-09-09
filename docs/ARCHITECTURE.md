# EMERIONA GLOBAL — Repository Architecture

## Principle
Complete Architecture from Day One — Progressive Activation.

## Layers
- Core / Shared: framework-neutral primitives and cross-cutting utilities.
- Domains: business capabilities and rules.
- Application: use-case orchestration.
- Delivery / Gateway: API delivery and edge policy enforcement.
- Security / Runtime: identity boundaries, configuration, feature flags and readiness.
- Infrastructure / Integrations: concrete implementations and external adapters.
- Quality: CI/CD and deployment gates.

## Dependency direction
Core and Shared do not depend on Domains. Domains depend on contracts/ports, never infrastructure/providers. Delivery and Gateway dispatch into Application. Provider-specific implementation stays behind Infrastructure/Integration boundaries.

## Workflow ownership
Step 33 is the sole canonical Workflow & Orchestration foundation. Step 34 v1.1 is a reliability and long-running execution extension only: retry, locking, idempotency, pause/resume/cancel, execution decisions, compensation requests and reliability audit/telemetry. Step 34 must never create a competing workflow source of truth.

## Progressive activation
EMERIONA ACADEMY, EMERIONA DIGITAL LAB and EMERIONA EVENTS are architecturally provisioned from day one and activated progressively through controlled runtime configuration/feature flags.
