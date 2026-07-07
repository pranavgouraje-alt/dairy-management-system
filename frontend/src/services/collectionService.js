const API = "http://localhost:5001/api/collections";

export async function getCollections() {
  const response = await fetch(API);
  return await response.json();
}

export async function addCollection(collection) {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collection),
  });

  return await response.json();
}

export async function updateCollection(collectionId, collection) {
  const response = await fetch(`${API}/${collectionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collection),
  });

  return await response.json();
}

export async function deleteCollection(collectionId) {
  const response = await fetch(`${API}/${collectionId}`, {
    method: "DELETE",
  });

  return await response.json();
}