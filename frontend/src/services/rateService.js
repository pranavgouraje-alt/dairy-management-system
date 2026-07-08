const API = "http://localhost:5001/api/rates";



export async function getRates() {
  const response = await fetch(API);
  return await response.json();
}

export async function addRate(data) {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

export async function updateRate(id, data) {
  const response = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

export async function deleteRate(id) {
  const response = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  return await response.json();
}