import apiClient, {
  createQuery,
} from "./apiClient";

const REPORT_API = "/api/reports";

export function getDashboardReport(
  date = ""
) {
  return apiClient.get(
    `${REPORT_API}/dashboard${createQuery(
      {
        date,
      }
    )}`
  );
}

export function getDailyReport(
  filters = {}
) {
  return apiClient.get(
    `${REPORT_API}/daily${createQuery(
      filters
    )}`
  );
}

export function getMemberReport(
  memberId,
  filters = {}
) {
  return apiClient.get(
    `${REPORT_API}/member/${memberId}${createQuery(
      filters
    )}`
  );
}

export function getFeedReport(
  filters = {}
) {
  return apiClient.get(
    `${REPORT_API}/feed${createQuery(
      filters
    )}`
  );
}

export function getAdvanceReport(
  filters = {}
) {
  return apiClient.get(
    `${REPORT_API}/advances${createQuery(
      filters
    )}`
  );
}

export function getBillReport(
  filters = {}
) {
  return apiClient.get(
    `${REPORT_API}/bills${createQuery(
      filters
    )}`
  );
}