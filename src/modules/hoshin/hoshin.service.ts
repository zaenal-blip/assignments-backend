import { PrismaClient } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";

export class HoshinService {
  constructor(private prisma: PrismaClient) {}

  getAll = async () => {
    return await this.prisma.hoshinKPI.findMany({
      orderBy: [{ cluster: "asc" }, { code: "asc" }],
    });
  };

  getById = async (id: number) => {
    const kpi = await this.prisma.hoshinKPI.findUnique({ where: { id } });
    if (!kpi) throw new ApiError("KPI Hoshin not found", 404);
    return kpi;
  };

  create = async (data: {
    code: string;
    cluster: string;
    subCluster?: string;
    actionPlan: string;
    target?: string;
  }) => {
    const existing = await this.prisma.hoshinKPI.findUnique({
      where: { code: data.code },
    });
    if (existing) throw new ApiError("KPI code already exists", 409);

    return await this.prisma.hoshinKPI.create({ data });
  };

  update = async (
    id: number,
    data: {
      code?: string;
      cluster?: string;
      subCluster?: string;
      actionPlan?: string;
      target?: string;
    }
  ) => {
    await this.getById(id); // ensure exists

    if (data.code) {
      const existing = await this.prisma.hoshinKPI.findFirst({
        where: { code: data.code, id: { not: id } },
      });
      if (existing) throw new ApiError("KPI code already exists", 409);
    }

    return await this.prisma.hoshinKPI.update({ where: { id }, data });
  };

  delete = async (id: number) => {
    await this.getById(id); // ensure exists
    return await this.prisma.hoshinKPI.delete({ where: { id } });
  };
}
