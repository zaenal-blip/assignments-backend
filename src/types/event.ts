import { PaginationQueryParams } from "./pagination.js";

export interface CreateEventBody {
  name: string;
  picId: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  tasks?: CreateTaskBody[];
}

export interface CreateTaskBody {
  name: string;
  picId: number;
  activities: string[]; // List of activity names for the checklist
}

export interface GetEventsQuery extends PaginationQueryParams {
  search?: string;
  startDate?: string;
  endDate?: string;
}
