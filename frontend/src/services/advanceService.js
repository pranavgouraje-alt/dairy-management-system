import apiClient, {
  createQuery,
} from "./apiClient";

const ADVANCE_API = "/api/advances";

export function getAdvanceRecords(
  filters = {}
) {
  return apiClient.get(
    `${ADVANCE_API}${createQuery(
      filters
    )}`
  );
}

export function getAdvanceById(
  advanceId
) {
  return apiClient.get(
    `${ADVANCE_API}/${advanceId}`
  );
}

export function addAdvanceRecord(
  advanceRecord
) {
  return apiClient.post(
    ADVANCE_API,
    advanceRecord
  );
}

export function updateAdvanceRecord(
  advanceId,
  advanceRecord
) {
  return apiClient.put(
    `${ADVANCE_API}/${advanceId}`,
    advanceRecord
  );
}

export function deductAdvance(
  advanceId,
  deductionAmount
) {
  return apiClient.patch(
    `${ADVANCE_API}/${advanceId}/deduct`,
    {
      deductionAmount,
    }
  );
}

export function deleteAdvanceRecord(
  advanceId
) {
  return apiClient.delete(
    `${ADVANCE_API}/${advanceId}`
  );
}