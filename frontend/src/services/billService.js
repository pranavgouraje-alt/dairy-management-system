const API_URL =
  "http://localhost:5001/api/bills";

async function parseResponse(
  response
) {
  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Bill API request failed"
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

    return parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError ) {
      //throw new Error( "Unable to connect to backend server on port 5001");
    }

    throw error;
  }
}

export function previewBill(
  billData
) {
  return request("/preview", {
    method: "POST",
    body:
      JSON.stringify(billData),
  });
}

export function generateBill(
  billData
) {
  return request("/generate", {
    method: "POST",
    body:
      JSON.stringify(billData),
  });
}

export function generateAllBills(
  billData
) {
  return request(
    "/generate-all",
    {
      method: "POST",
      body:
        JSON.stringify(
          billData
        ),
    }
  );
}

export function getBills(
  filters = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(filters).forEach(
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

  return request(
    queryText
      ? `/?${queryText}`
      : "/"
  );
}

export function getBillSummary(
  filters = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(filters).forEach(
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

  return request(
    queryText
      ? `/summary?${queryText}`
      : "/summary"
  );
}

export function getMemberBills(
  memberId
) {
  return request(
    `/member/${memberId}`
  );
}

export function getBillById(
  billId
) {
  return request(
    `/${billId}`
  );
}

export function updateBill(
  billId,
  data
) {
  return request(
    `/${billId}`,
    {
      method: "PUT",
      body:
        JSON.stringify(data),
    }
  );
}

export function addBillPayment(
  billId,
  data
) {
  return request(
    `/${billId}/payments`,
    {
      method: "POST",
      body:
        JSON.stringify(data),
    }
  );
}

export function deleteBill(
  billId
) {
  return request(
    `/${billId}`,
    {
      method: "DELETE",
    }
  );
}
