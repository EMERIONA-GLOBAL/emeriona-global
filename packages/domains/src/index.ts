export type { EntityRecord, EntityRepository } from "./repositories.js";
export { REPOSITORY_PORT_VERSION } from "./repositories.js";

/** Domain package public boundary. Keep provider-specific infrastructure out of this layer. */
export const DOMAIN_LAYER_VERSION = "1.0.0" as const;
