const API = "http://localhost:5001/api/feed";

async function handleResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    result = {
      success: false,
      message: "Invalid response received from backend",
    };
  }

  if (!response.ok) {
    throw new Error(
      result.message || "Feed API request failed"
    );
  }

  return result;
}

export async function getFeedRecords() {
  const response = await fetch(API);

  return handleResponse(response);
}

export async function getFeedRecordById(feedId) {
  const response = await fetch(`${API}/${feedId}`);

  return handleResponse(response);
}

export async function addFeedRecord(feedRecord) {
  const response = await fetch(API, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(feedRecord),
  });

  return handleResponse(response);
}

export async function updateFeedRecord(
  feedId,
  feedRecord
) {
  const response = await fetch(`${API}/${feedId}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(feedRecord),
  });

  return handleResponse(response);
}

export async function deleteFeedRecord(feedId) {
  const response = await fetch(`${API}/${feedId}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}