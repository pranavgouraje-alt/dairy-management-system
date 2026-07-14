const API =
  "http://localhost:5001/api/reports";

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
        "Report API request failed"
    );
  }

  return result;
}

function createQuery(parameters = {}) {
  const query = new URLSearchParams();

  Object.entries(parameters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.append(key, value);
      }
    }
  );

  const queryString = query.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

export async function getDashboardReport(
  date = ""
) {
  const response = await fetch(
    `${API}/dashboard${createQuery({
      date,
    })}`
  );

  return handleResponse(response);
}

export async function getDailyReport(
  filters = {}
) {
  const response = await fetch(
    `${API}/daily${createQuery(filters)}`
  );

  return handleResponse(response);
}

export async function getMemberReport(
  memberId,
  filters = {}
) {
  const response = await fetch(
    `${API}/member/${memberId}${createQuery(
      filters
    )}`
  );

  return handleResponse(response);
}

export async function getFeedReport(
  filters = {}
) {
  const response = await fetch(
    `${API}/feed${createQuery(filters)}`
  );

  return handleResponse(response);
}

export async function getAdvanceReport(
  filters = {}
) {
  const response = await fetch(
    `${API}/advances${createQuery(
      filters
    )}`
  );

  return handleResponse(response);
}

export async function getBillReport(
  filters = {}
) {
  const response = await fetch(
    `${API}/bills${createQuery(filters)}`
  );

  return handleResponse(response);
}