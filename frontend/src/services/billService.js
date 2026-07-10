const API =
  "http://localhost:5001/api/bills";

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
        "Bill API request failed"
    );
  }

  return result;
}

export async function getBills(
  filters = {}
) {
  const query = new URLSearchParams();

  if (filters.memberId) {
    query.append(
      "memberId",
      filters.memberId
    );
  }

  if (filters.billMonth) {
    query.append(
      "billMonth",
      filters.billMonth
    );
  }

  if (filters.billCycle) {
    query.append(
      "billCycle",
      filters.billCycle
    );
  }

  const queryString =
    query.toString();

  const url = queryString
    ? `${API}?${queryString}`
    : API;

  const response = await fetch(url);

  return handleResponse(response);
}

export async function getBillById(
  billId
) {
  const response = await fetch(
    `${API}/${billId}`
  );

  return handleResponse(response);
}

export async function generateBill(
  billData
) {
  const response = await fetch(
    `${API}/generate`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(billData),
    }
  );

  return handleResponse(response);
}

export async function generateAllBills(
  billData
) {
  const response = await fetch(
    `${API}/generate-all`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(billData),
    }
  );

  return handleResponse(response);
}

export async function deleteBill(
  billId
) {
  const response = await fetch(
    `${API}/${billId}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}