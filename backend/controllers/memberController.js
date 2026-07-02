const members = require("../data/membersData");

function getAllMembers(req, res) {
  res.status(200).json({
    success: true,
    count: members.length,
    data: members,
  });
}

function getMemberById(req, res) {
  const memberId = req.params.id;

  const member = members.find(
    (m) => m.memberId === memberId
  );

  if (!member) {
    return res.status(404).json({
      success: false,
      message: "Member not found",
    });
  }

  res.status(200).json({
    success: true,
    data: member,
  });
}

function createMember(req, res) {
  const { memberId, name, mobile, village, status } = req.body;

  if (!memberId || !name || !mobile) {
    return res.status(400).json({
      success: false,
      message: "Member ID, name and mobile are required",
    });
  }

  const existingMember = members.find(
    (m) => m.memberId === memberId
  );

  if (existingMember) {
    return res.status(409).json({
      success: false,
      message: "Member ID already exists",
    });
  }

  const newMember = {
    memberId,
    name,
    mobile,
    village: village || "",
    status: status || "Active",
  };

  members.push(newMember);

  res.status(201).json({
    success: true,
    message: "Member created successfully",
    data: newMember,
  });
}

function updateMember(req, res) {
  const memberId = req.params.id;

  const memberIndex = members.findIndex(
    (m) => m.memberId === memberId
  );

  if (memberIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Member not found",
    });
  }

  const { name, mobile, village, status } = req.body;

  members[memberIndex] = {
    ...members[memberIndex],
    name: name || members[memberIndex].name,
    mobile: mobile || members[memberIndex].mobile,
    village: village || members[memberIndex].village,
    status: status || members[memberIndex].status,
  };

  res.status(200).json({
    success: true,
    message: "Member updated successfully",
    data: members[memberIndex],
  });
}

function deleteMember(req, res) {
  const memberId = req.params.id;

  const memberIndex = members.findIndex(
    (m) => m.memberId === memberId
  );

  if (memberIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Member not found",
    });
  }

  const deletedMember = members.splice(memberIndex, 1);

  res.status(200).json({
    success: true,
    message: "Member deleted successfully",
    data: deletedMember[0],
  });
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};