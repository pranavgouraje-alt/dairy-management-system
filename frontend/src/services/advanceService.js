const API =
  "http://localhost:5001/api/advance";

async function handleResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    result = {
      success: false,
      message:
        "Invalid response received from backend",
    };
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Advance API request failed"
    );
  }

  return result;
}

export async function getAdvanceRecords() {
  const response = await fetch(API);

  return handleResponse(response);
}

export async function getAdvanceById(
  advanceId
) {
  const response = await fetch(
    `${API}/${advanceId}`
  );

  return handleResponse(response);
}

export async function addAdvanceRecord(
  advanceRecord
) {
  const response = await fetch(API, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(advanceRecord),
  });

  return handleResponse(response);
}

export async function updateAdvanceRecord(
  advanceId,
  advanceRecord
) {
  const response = await fetch(
    `${API}/${advanceId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(advanceRecord),
    }
  );

  return handleResponse(response);
}

export async function deductAdvance(
  advanceId,
  deductionAmount
) {
  const response = await fetch(
    `${API}/${advanceId}/deduct`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        deductionAmount,
      }),
    }
  );

  return handleResponse(response);
}

export async function deleteAdvanceRecord(
  advanceId
) {
  const response = await fetch(
    `${API}/${advanceId}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}