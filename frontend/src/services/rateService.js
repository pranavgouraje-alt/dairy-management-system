import apiClient from "./apiClient";

const RATE_API = "/api/rates";

export function getRates() {
  return apiClient.get(RATE_API);
}

export function getRateById(rateId) {
  return apiClient.get(
    `${RATE_API}/${rateId}`
  );
}

export function addRate(rateData) {
  return apiClient.post(
    RATE_API,
    rateData
  );
}

export function updateRate(
  rateId,
  rateData
) {
  return apiClient.put(
    `${RATE_API}/${rateId}`,
    rateData
  );
}

export function deleteRate(rateId) {
  return apiClient.delete(
    `${RATE_API}/${rateId}`
  );
}