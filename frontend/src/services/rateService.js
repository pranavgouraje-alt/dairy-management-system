import apiClient, {
  createQuery,
} from "./apiClient";

const RATE_API = "/api/rates";

/*
  Load all active and inactive rates.
*/
export function getRates() {
  return apiClient.get(
    RATE_API
  );
}

/*
  Load one rate.
*/
export function getRateById(rateId) {
  return apiClient.get(
    `${RATE_API}/${rateId}`
  );
}

/*
  Find a rate for Collection.jsx.
*/
export function lookupRate({
  milkType,
  fat,
  snf,
}) {
  return apiClient.get(
    `${RATE_API}/lookup${createQuery({
      milkType,
      fat,
      snf,
    })}`
  );
}

/*
  Create rate.
*/
export function addRate(rateData) {
  return apiClient.post(
    RATE_API,
    rateData
  );
}

/*
  Update rate.
*/
export function updateRate(
  rateId,
  rateData
) {
  return apiClient.put(
    `${RATE_API}/${rateId}`,
    rateData
  );
}

/*
  Delete rate.
*/
export function deleteRate(rateId) {
  return apiClient.delete(
    `${RATE_API}/${rateId}`
  );
}

/*
  Load rate history.
*/
export function getRateHistory(
  filters = {}
) {
  return apiClient.get(
    `${RATE_API}/history/all${createQuery(
      filters
    )}`
  );
}