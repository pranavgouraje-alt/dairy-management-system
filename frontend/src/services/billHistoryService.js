const API_URL =
  "http://localhost:5001/api/bill-history";

async function handleResponse(
  response
) {
  let result;

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response received from backend"
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
      "Bill history API request failed"
    );
  }

  return result;
}

async function request(
  endpoint,
  options = {}
) {
  try {
    const token =
      localStorage.getItem(
        "dairyAuthToken"
      );

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...(options.headers || {}),
        },
      }
    );

    return handleResponse(
      response
    );
  } catch (error) {
    console.error(
      "Bill history API error:",
      error
    );

    if (
      error instanceof TypeError
    ) {
      throw new Error(
        "Unable to connect to backend server on port 5001"
      );
    }

    throw error;
  }
}

function createQuery(
  filters = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(
    filters
  ).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.append(
          key,
          value
        );
      }
    }
  );

  const queryText =
    query.toString();

  return queryText
    ? `?${queryText}`
    : "";
}

/*
  GET /api/bill-history
*/
export function getBillHistory(
  filters = {}
) {
  return request(
    `/${createQuery(filters)}`
  );
}

/*
  PATCH /api/bill-history/:billId/cancel
*/
export function cancelBill(
  billId
) {
  if (!billId) {
    return Promise.reject(
      new Error(
        "Bill ID is required"
      )
    );
  }

  return request(
    `/${billId}/cancel`,
    {
      method: "PATCH",
    }
  );
}