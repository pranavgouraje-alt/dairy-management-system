{
  reserveId: Date.now(),
  memberId: "101",
  memberName: "Pranav",
  billMonth: "2026-06",
  billCycle: "1",
  fromDate: "2026-06-01",
  toDate: "2026-06-10",
  milkAmount: 5000,
  reserveAmount: 500,
  financialYear: "2025-2026"
}

function getFinancialYear(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
}