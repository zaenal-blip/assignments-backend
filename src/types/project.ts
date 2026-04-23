import { PaginationQueryParams } from "./pagination.js";

export interface CreateProjectBody {
  name: string;
  picId: number;
  startDate: string;
  endDate: string;
  description?: string;
  hoshinId?: number;
  actionPlan?: string;
  tasks?: CreateProjectTaskBody[];
}

export interface CreateProjectTaskBody {
  name: string;
  picId: number;
  activities: string[]; // Checklist items
}

export interface GetProjectsQuery extends PaginationQueryParams {
  search?: string;
}
