/** Provider-neutral AI domain boundaries. Model providers remain outside the domain. */
export type RecommendationId = string & { readonly __brand: "RecommendationId" };
export type AgentRunId = string & { readonly __brand: "AgentRunId" };

export interface Recommendation { readonly id: RecommendationId; readonly subjectId: string; readonly itemIds: readonly string[]; readonly reason?: string; }
export interface SalesAssistantRequest { readonly customerId?: string; readonly query: string; readonly context?: Readonly<Record<string, unknown>>; }
export interface SalesAssistantResponse { readonly answer: string; readonly recommendedItemIds: readonly string[]; }
export interface AgentRun { readonly id: AgentRunId; readonly agentId: string; readonly status: "REQUESTED" | "RUNNING" | "COMPLETED" | "FAILED"; }

export interface RecommendationPort { generate(input: { subjectId: string; context?: Readonly<Record<string, unknown>> }): Promise<Recommendation>; }
export interface SalesAssistantPort { assist(input: SalesAssistantRequest): Promise<SalesAssistantResponse>; }
export interface AgentPort { execute(input: { agentId: string; input: Readonly<Record<string, unknown>> }): Promise<AgentRun>; }
export interface ModelRouterPort { select(input: { capability: string; constraints?: Readonly<Record<string, unknown>> }): Promise<{ modelId: string; provider: string }>; }

export const AI_DOMAIN_VERSION = "1.0.0" as const;
