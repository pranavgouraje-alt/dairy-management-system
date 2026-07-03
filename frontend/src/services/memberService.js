const API = "http://localhost:5000/api/members";

export async function getMembers() {
  const response = await fetch(API);
  return await response.json();
}

export async function addMember(member) {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(member),
  });

  return await response.json();
}

export async function updateMember(memberId, member) {
  const response = await fetch(`${API}/${memberId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(member),
  });

  return await response.json();
}

export async function deleteMember(memberId) {
  const response = await fetch(`${API}/${memberId}`, {
    method: "DELETE",
  });

  return await response.json();
}