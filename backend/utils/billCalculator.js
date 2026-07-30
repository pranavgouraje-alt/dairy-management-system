function toNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function roundAmount(value) {
  return Number(
    toNumber(value).toFixed(2)
  );
}

function validateBillMonth(billMonth) {
  if (
    !/^\d{4}-\d{2}$/.test(
      String(billMonth || "")
    )
  ) {
    throw new Error(
      "Bill month must use YYYY-MM format"
    );
  }

  const month = Number(
    String(billMonth).split("-")[1]
  );

  if (month < 1 || month > 12) {
    throw new Error(
      "Bill month is invalid"
    );
  }
}

function getBillingPeriod(
  billMonth,
  billCycle
) {
  validateBillMonth(billMonth);

  const cycle = Number(billCycle);

  if (![1, 2, 3].includes(cycle)) {
    throw new Error(
      "Bill cycle must be 1, 2 or 3"
    );
  }

  const [yearText, monthText] =
    billMonth.split("-");

  const year = Number(yearText);
  const month = Number(monthText);

  let fromDay = 1;
  let toDay = 10;

  if (cycle === 2) {
    fromDay = 11;
    toDay = 20;
  }

  if (cycle === 3) {
    fromDay = 21;
    toDay = new Date(
      year,
      month,
      0
    ).getDate();
  }

  const fromDate =
    `${yearText}-${monthText}-${String(
      fromDay
    ).padStart(2, "0")}`;

  const toDate =
    `${yearText}-${monthText}-${String(
      toDay
    ).padStart(2, "0")}`;

  return {
    billMonth,
    billCycle: cycle,
    fromDate,
    toDate,
  };
}

function calculateMilkSummary(
  collections = []
) {
  const summary = {
    cowMilk: 0,
    buffaloMilk: 0,
    totalMilk: 0,
    cowAmount: 0,
    buffaloAmount: 0,
    milkAmount: 0,
    averageFat: 0,
    averageSnf: 0,
  };

  let totalFatWeight = 0;
  let totalSnfWeight = 0;

  for (const collection of collections) {
    const quantity = toNumber(
      collection.quantity
    );

    const amount = toNumber(
      collection.amount
    );

    const fat = toNumber(
      collection.fat
    );

    const snf = toNumber(
      collection.snf
    );

    if (
      String(
        collection.milk_type ||
        collection.milkType
      ).toLowerCase() === "cow"
    ) {
      summary.cowMilk += quantity;
      summary.cowAmount += amount;
    } else {
      summary.buffaloMilk += quantity;
      summary.buffaloAmount += amount;
    }

    summary.totalMilk += quantity;
    summary.milkAmount += amount;

    totalFatWeight += fat * quantity;
    totalSnfWeight += snf * quantity;
  }

  summary.averageFat =
    summary.totalMilk > 0
      ? totalFatWeight /
        summary.totalMilk
      : 0;

  summary.averageSnf =
    summary.totalMilk > 0
      ? totalSnfWeight /
        summary.totalMilk
      : 0;

  return {
    cowMilk:
      roundAmount(summary.cowMilk),

    buffaloMilk:
      roundAmount(
        summary.buffaloMilk
      ),

    totalMilk:
      roundAmount(summary.totalMilk),

    cowAmount:
      roundAmount(summary.cowAmount),

    buffaloAmount:
      roundAmount(
        summary.buffaloAmount
      ),

    milkAmount:
      roundAmount(summary.milkAmount),

    averageFat:
      roundAmount(summary.averageFat),

    averageSnf:
      roundAmount(summary.averageSnf),
  };
}

function calculateBillTotals({
  milkAmount,
  feedDue = 0,
  advanceDue = 0,
  otherDeduction = 0,
  reservePercent = 0,
}) {
  const grossAmount = Math.max(
    roundAmount(milkAmount),
    0
  );

  const safeFeedDue = Math.max(
    roundAmount(feedDue),
    0
  );

  const safeAdvanceDue = Math.max(
    roundAmount(advanceDue),
    0
  );

  const safeOtherDeduction = Math.max(
    roundAmount(otherDeduction),
    0
  );

  const safeReservePercent =
    Math.min(
      Math.max(
        roundAmount(reservePercent),
        0
      ),
      100
    );

  let availableAmount = grossAmount;

  const feedDeducted = Math.min(
    safeFeedDue,
    availableAmount
  );

  availableAmount = roundAmount(
    availableAmount - feedDeducted
  );

  const advanceDeducted = Math.min(
    safeAdvanceDue,
    availableAmount
  );

  availableAmount = roundAmount(
    availableAmount -
      advanceDeducted
  );

  const otherDeducted = Math.min(
    safeOtherDeduction,
    availableAmount
  );

  availableAmount = roundAmount(
    availableAmount -
      otherDeducted
  );

  const requestedReserve = roundAmount(
    grossAmount *
      (safeReservePercent / 100)
  );

  const reserveAmount = Math.min(
    requestedReserve,
    availableAmount
  );

  availableAmount = roundAmount(
    availableAmount -
      reserveAmount
  );

  const totalDeduction = roundAmount(
    feedDeducted +
      advanceDeducted +
      otherDeducted +
      reserveAmount
  );

  const netPayable = roundAmount(
    Math.max(
      grossAmount - totalDeduction,
      0
    )
  );

  return {
    milkAmount: grossAmount,

    feedDue: safeFeedDue,
    feedDeducted:
      roundAmount(feedDeducted),
    remainingFeedDue:
      roundAmount(
        safeFeedDue - feedDeducted
      ),

    advanceDue: safeAdvanceDue,
    advanceDeducted:
      roundAmount(advanceDeducted),
    remainingAdvanceDue:
      roundAmount(
        safeAdvanceDue -
          advanceDeducted
      ),

    otherDeduction:
      roundAmount(otherDeducted),

    reservePercent:
      safeReservePercent,
    reserveAmount:
      roundAmount(reserveAmount),

    totalDeduction,
    netPayable,
    paidAmount: 0,
    balanceAmount: netPayable,
    status:
      netPayable > 0
        ? "Pending"
        : "Paid",
  };
}

function generateBillNumber({
  billMonth,
  billCycle,
  memberId,
}) {
  const compactMonth =
    String(billMonth).replace("-", "");

  const cleanMemberId =
    String(memberId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

  const stamp = Date.now()
    .toString()
    .slice(-6);

  return [
    "BILL",
    compactMonth,
    `C${billCycle}`,
    cleanMemberId,
    stamp,
  ].join("-");
}

function generatePaymentNumber() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const stamp = Date.now()
    .toString()
    .slice(-6);

  return `PAY-${year}${month}${day}-${stamp}`;
}

module.exports = {
  toNumber,
  roundAmount,
  getBillingPeriod,
  calculateMilkSummary,
  calculateBillTotals,
  generateBillNumber,
  generatePaymentNumber,
};
