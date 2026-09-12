# EMERIONA GLOBAL — Data Layer

## Purpose

The Data Layer is the persistence boundary for EMERIONA GLOBAL. It is designed for progressive activation: the architecture is established from day one, while individual capabilities and data domains are activated as the platform grows.

## Initial persistence target

- Primary operational database: Cloudflare D1
- Planned binding: `DB`
- Planned database name: `emeriona-global-db`
- Migration source of truth: `database/migrations/`

## Architectural rules

1. Domain and Application layers must not depend directly on D1 APIs.
2. Database access stays behind ports/repositories and Infrastructure adapters.
3. Schema changes are migration-driven and versioned.
4. No production data is assumed by the foundation migration.
5. Commerce, customers, orders, payments, partners, knowledge, analytics and impact domains can evolve independently while sharing the same governed persistence boundary.

## Activation

D1 is a foundational infrastructure capability. Creating the database and binding it does not by itself activate selling, payments, or any customer-facing commercial workflow.
