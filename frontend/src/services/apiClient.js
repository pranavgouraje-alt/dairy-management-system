const BASE_URL =
  "http://localhost:5001";

export class ApiError extends Error {
  constructor(
    message,
    status = 0,
    data = null
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getStoredToken() {
  return localStorage.getItem(
    "dairyAuthToken"
  );
}

async function parseResponse(response) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  return {
    success: response.ok,
    message: text,
  };
}

async function request(
  endpoint,
  options = {}
) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint}`;

  const token = getStoredToken();

  const requestHeaders = {
    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),

    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: requestHeaders,
    });

    const result =
      await parseResponse(response);

    if (!response.ok) {
      /*
        Automatically clear invalid or
        expired authentication sessions.
      */
      if (
        response.status === 401 &&
        endpoint !== "/api/auth/login"
      ) {
        localStorage.removeItem(
          "dairyAuthToken"
        );

        localStorage.removeItem(
          "dairyAuthUser"
        );
      }

      throw new ApiError(
        result?.message ||
          `Request failed with status ${response.status}`,
        response.status,
        result
      );
    }

    return (
      result || {
        success: true,
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        "Unable to connect to the backend server. Start the backend on port 5001.",
        0,
        null
      );
    }

    throw new ApiError(
      error.message ||
        "Unexpected API error",
      0,
      null
    );
  }
}

export function createQuery(
  parameters = {}
) {
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

  const queryString =
    query.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

const apiClient = {
  get(endpoint, options = {}) {
    return request(endpoint, {
      method: "GET",
      ...options,
    });
  },

  post(endpoint, data, options = {}) {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  },

  put(endpoint, data, options = {}) {
    return request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  },

  patch(endpoint, data, options = {}) {
    return request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete(endpoint, options = {}) {
    return request(endpoint, {
      method: "DELETE",
      ...options,
    });
  },
};

export default apiClient;