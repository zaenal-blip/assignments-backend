import { PaginationQueryParams } from "./pagination.js";

export interface CreateProjectBody {
  name: string;
  picId: number;
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
