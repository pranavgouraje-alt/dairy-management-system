import apiClient from "./apiClient";

const MEMBER_API = "/api/members";

export function getMembers() {
  return apiClient.get(MEMBER_API);
}

export function getMemberById(
  memberId
) {
  return apiClient.get(
    `${MEMBER_API}/${memberId}`
  );
}

export function addMember(memberData) {
  return apiClient.post(
    MEMBER_API,
    memberData
  );
}

export function updateMember(
  memberId,
  memberData
) {
  return apiClient.put(
    `${MEMBER_API}/${memberId}`,
    memberData
  );
}

export function deleteMember(memberId) {
  return apiClient.delete(
    `${MEMBER_API}/${memberId}`
  );
}