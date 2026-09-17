import type { UseCaseHandler, UseCaseRequest, UseCaseResponse } from "./index.js";
import type { PartnerCatalogRepositoryPortV1, PartnerId, PartnerService, ServiceId } from "../../domains/src/index.js";

export interface PartnerServiceUpdateInput {
  serviceId: string;
  partnerId: string;
  ownerId?: string;
  name?: string;
  status?: PartnerService["status"];
}

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

export class UpdatePartnerServiceHandler implements UseCaseHandler<PartnerServiceUpdateInput, PartnerService> {
  constructor(private readonly repository: PartnerCatalogRepositoryPortV1) {}

  async handle(request: UseCaseRequest<PartnerServiceUpdateInput>): Promise<UseCaseResponse<PartnerService>> {
    const serviceId = required(request.input.serviceId, "serviceId") as ServiceId;
    const partnerId = required(request.input.partnerId, "partnerId") as PartnerId;
    if (request.input.ownerId === undefined && request.input.name === undefined && request.input.status === undefined) {
      throw new Error("At least one partner service field must be provided");
    }
    const updated = await this.repository.updateService(
      serviceId,
      {
        ownerId: request.input.ownerId === undefined ? undefined : required(request.input.ownerId, "ownerId"),
        name: request.input.name === undefined ? undefined : required(request.input.name, "name"),
        status: request.input.status,
      },
      partnerId,
      request.context.tenantId,
    );
    return { useCaseId: request.useCaseId, correlationId: request.context.correlationId, output: updated };
  }
}

export const PARTNER_SERVICE_UPDATE_APPLICATION_VERSION = "1.0.0" as const;
