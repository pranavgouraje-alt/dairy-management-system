import apiClient, {
  createQuery,
} from "./apiClient";

const COLLECTION_API =
  "/api/collections";

export function getCollections(
  filters = {}
) {
  return apiClient.get(
    `${COLLECTION_API}${createQuery(
      filters
    )}`
  );
}

export function getCollectionById(
  collectionId
) {
  return apiClient.get(
    `${COLLECTION_API}/${collectionId}`
  );
}

export function addCollection(
  collectionData
) {
  return apiClient.post(
    COLLECTION_API,
    collectionData
  );
}

export function updateCollection(
  collectionId,
  collectionData
) {
  return apiClient.put(
    `${COLLECTION_API}/${collectionId}`,
    collectionData
  );
}

export function deleteCollection(
  collectionId
) {
  return apiClient.delete(
    `${COLLECTION_API}/${collectionId}`
  );
}