import { PaginationQueryParams } from "./pagination.js";

export interface GetNotificationsQuery extends PaginationQueryParams {
  isRead?: boolean;
}
