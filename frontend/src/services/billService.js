const API = "http://localhost:5001/api/bills";

async function request(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("dairyAuthToken");

    const response = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Bill API request failed");
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to backend server on port 5001"
      );
    }

    throw error;
  }
}

function query(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  return params.toString() ? `?${params.toString()}` : "";
}

export const getBills = (filters = {}) =>
  request(`/${query(filters)}`);

export const getBillById = (billId) =>
  request(`/${billId}`);

export const generateBill = (data) =>
  request("/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const generateAllBills = (data) =>
  request("/generate-all", {
    method: "POST",
    body: JSON.stringify(data),
  });
