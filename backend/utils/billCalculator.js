
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


function calculateWeightedAverage(
  records,
  fieldName
) {
  const totalQuantity = records.reduce(
    (sum, record) =>
      sum + toNumber(record.quantity),
    0
  );

  if (totalQuantity <= 0) {
    return 0;
  }

  const weightedTotal = records.reduce(
    (sum, record) =>
      sum +
      toNumber(record.quantity) *
        toNumber(record[fieldName]),
    0
  );

  return roundAmount(
    weightedTotal / totalQuantity
  );
}


function calculateMilkSummary(
  collections = []
) {
  const initialSummary = {
    cowMilk: 0,
    buffaloMilk: 0,
    totalMilk: 0,

    cowAmount: 0,
    buffaloAmount: 0,
    milkAmount: 0,

    averageFat: 0,
    averageSnf: 0,

    cowMorningMilk: 0,
    cowEveningMilk: 0,

    buffaloMorningMilk: 0,
    buffaloEveningMilk: 0,

    collectionCount: 0,
  };

  const summary = collections.reduce(
    (result, collection) => {
      const quantity = toNumber(
        collection.quantity
      );

      const amount = toNumber(
        collection.amount
      );

      result.totalMilk += quantity;
      result.milkAmount += amount;
      result.collectionCount += 1;

      if (
        collection.milk_type === "Cow"
      ) {
        result.cowMilk += quantity;
        result.cowAmount += amount;

        if (
          collection.session ===
          "Morning"
        ) {
          result.cowMorningMilk +=
            quantity;
        } else {
          result.cowEveningMilk +=
            quantity;
        }
      }

      if (
        collection.milk_type ===
        "Buffalo"
      ) {
        result.buffaloMilk +=
          quantity;

        result.buffaloAmount +=
          amount;

        if (
          collection.session ===
          "Morning"
        ) {
          result.buffaloMorningMilk +=
            quantity;
        } else {
          result.buffaloEveningMilk +=
            quantity;
        }
      }

      return result;
    },
    initialSummary
  );

  summary.averageFat =
    calculateWeightedAverage(
      collections,
      "fat"
    );

  summary.averageSnf =
    calculateWeightedAverage(
      collections,
      "snf"
    );

  Object.keys(summary).forEach(
    (key) => {
      if (
        key !== "collectionCount"
      ) {
        summary[key] = roundAmount(
          summary[key]
        );
      }
    }
  );

  return summary;
}


function calculateAvailableDeduction(
  dueAmount,
  availableAmount
) {
  const due = Math.max(
    0,
    toNumber(dueAmount)
  );

  const available = Math.max(
    0,
    toNumber(availableAmount)
  );

  return roundAmount(
    Math.min(due, available)
  );
}


function calculateBillTotals({
  milkAmount,
  feedDue = 0,
  advanceDue = 0,
  otherDeduction = 0,
  reservePercent = 10,
}) {
  const safeMilkAmount = Math.max(
    0,
    toNumber(milkAmount)
  );

  const safeReservePercent =
    Math.max(
      0,
      toNumber(reservePercent)
    );

  const reserveAmount = roundAmount(
    safeMilkAmount *
      (safeReservePercent / 100)
  );

  let availableAmount = roundAmount(
    safeMilkAmount - reserveAmount
  );

  const feedDeducted =
    calculateAvailableDeduction(
      feedDue,
      availableAmount
    );

  availableAmount = roundAmount(
    availableAmount - feedDeducted
  );

  const advanceDeducted =
    calculateAvailableDeduction(
      advanceDue,
      availableAmount
    );

  availableAmount = roundAmount(
    availableAmount -
      advanceDeducted
  );

  const safeOtherDeduction =
    calculateAvailableDeduction(
      otherDeduction,
      availableAmount
    );

  availableAmount = roundAmount(
    availableAmount -
      safeOtherDeduction
  );

  const totalDeduction = roundAmount(
    reserveAmount +
      feedDeducted +
      advanceDeducted +
      safeOtherDeduction
  );

  const netPayable = roundAmount(
    Math.max(
      0,
      safeMilkAmount -
        totalDeduction
    )
  );

  const remainingFeedDue =
    roundAmount(
      Math.max(
        0,
        toNumber(feedDue) -
          feedDeducted
      )
    );

  const remainingAdvanceDue =
    roundAmount(
      Math.max(
        0,
        toNumber(advanceDue) -
          advanceDeducted
      )
    );

  return {
    milkAmount:
      roundAmount(safeMilkAmount),

    reservePercent:
      roundAmount(
        safeReservePercent
      ),

    reserveAmount,

    feedDue:
      roundAmount(feedDue),

    feedDeducted,

    remainingFeedDue,

    advanceDue:
      roundAmount(advanceDue),

    advanceDeducted,

    remainingAdvanceDue,

    otherDeduction:
      safeOtherDeduction,

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


function getBillingPeriod(
  billMonth,
  billCycle
) {
  const monthPattern =
    /^\d{4}-\d{2}$/;

  if (
    !monthPattern.test(
      String(billMonth)
    )
  ) {
    throw new Error(
      "Bill month must use YYYY-MM format"
    );
  }

  const cycle = Number(
    billCycle
  );

  if (![1, 2, 3].includes(cycle)) {
    throw new Error(
      "Bill cycle must be 1, 2 or 3"
    );
  }

  const [
    year,
    monthNumber,
  ] = billMonth
    .split("-")
    .map(Number);

  const lastDay = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  let startDay;
  let endDay;

  if (cycle === 1) {
    startDay = 1;
    endDay = 10;
  } else if (cycle === 2) {
    startDay = 11;
    endDay = 20;
  } else {
    startDay = 21;
    endDay = lastDay;
  }

  const formatDay = (day) =>
    String(day).padStart(2, "0");

  return {
    billMonth,

    billCycle: cycle,

    fromDate:
      `${billMonth}-${formatDay(
        startDay
      )}`,

    toDate:
      `${billMonth}-${formatDay(
        endDay
      )}`,

    cycleLabel:
      cycle === 1
        ? "Cycle 1: 1–10"
        : cycle === 2
          ? "Cycle 2: 11–20"
          : `Cycle 3: 21–${lastDay}`,
  };
}


function generateBillNumber({
  billMonth,
  billCycle,
  memberId,
}) {
  const cleanMonth =
    String(billMonth).replace(
      "-",
      ""
    );

  const cleanMemberId =
    String(memberId).replace(
      /[^a-zA-Z0-9]/g,
      ""
    );

  return [
    "BILL",
    cleanMonth,
    `C${billCycle}`,
    `M${cleanMemberId}`,
    Date.now(),
  ].join("-");
}

function generatePaymentNumber() {
  return `PAY-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

module.exports = {
  toNumber,
  roundAmount,
  calculateWeightedAverage,
  calculateMilkSummary,
  calculateAvailableDeduction,
  calculateBillTotals,
  getBillingPeriod,
  generateBillNumber,
  generatePaymentNumber,
};