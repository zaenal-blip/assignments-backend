import { PaginationQueryParams } from "./pagination.js";

export interface UpdateTaskProgressBody {
  activityId: number;
  isCompleted: boolean;
}

export interface AssignTaskBody {
  picId: number;
}

export interface GetTasksQuery extends PaginationQueryParams {
  sourceType?: "EVENT" | "PROJECT" | "PERSONAL" | "REGULAR";
  picId?: number;
}
