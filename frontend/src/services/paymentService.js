const API_URL =
  "http://localhost:5001/api/payments";

/*
  Convert backend response into JSON
  and throw backend error messages.
*/
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
      "Payment API request failed"
    );
  }

  return result;
}

/*
  Common API request function.
*/
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
      "Payment API error:",
      error
    );

    /*
      Fetch throws TypeError when the
      backend server cannot be reached.
    */
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

/*
  Convert filter object into query string.
*/
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
  GET /api/payments
*/
export function getPayments(
  filters = {}
) {
  return request(
    `/${createQuery(filters)}`
  );
}

/*
  GET /api/payments/summary
*/
export function getPaymentSummary(
  filters = {}
) {
  return request(
    `/summary${createQuery(
      filters
    )}`
  );
}

/*
  POST /api/payments/bill/:billId
*/
export function addPayment(
  billId,
  paymentData
) {
  if (!billId) {
    return Promise.reject(
      new Error(
        "Bill ID is required"
      )
    );
  }

  return request(
    `/bill/${billId}`,
    {
      method: "POST",

      body:
        JSON.stringify(
          paymentData
        ),
    }
  );
}

/*
  DELETE /api/payments/:paymentId
*/
export function deletePayment(
  paymentId
) {
  if (!paymentId) {
    return Promise.reject(
      new Error(
        "Payment ID is required"
      )
    );
  }

  return request(
    `/${paymentId}`,
    {
      method: "DELETE",
    }
  );
}