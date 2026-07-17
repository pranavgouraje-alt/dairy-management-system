import apiClient, {
  createQuery,
} from "./apiClient";

const FEED_API = "/api/feed";

export function getFeedRecords(
  filters = {}
) {
  return apiClient.get(
    `${FEED_API}${createQuery(filters)}`
  );
}

export function getFeedRecordById(
  feedId
) {
  return apiClient.get(
    `${FEED_API}/${feedId}`
  );
}

export function addFeedRecord(
  feedRecord
) {
  return apiClient.post(
    FEED_API,
    feedRecord
  );
}

export function updateFeedRecord(
  feedId,
  feedRecord
) {
  return apiClient.put(
    `${FEED_API}/${feedId}`,
    feedRecord
  );
}

export function deleteFeedRecord(
  feedId
) {
  return apiClient.delete(
    `${FEED_API}/${feedId}`
  );
}