function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function numberValue(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function money(value) {
  return numberValue(value).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const stringValue =
    String(value).slice(0, 10);

  const parts =
    stringValue.split("-");

  if (parts.length !== 3) {
    return stringValue;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function getCurrentDate() {
  return new Date()
    .toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    )
    .replaceAll("/", "-");
}

function groupCollections(bill) {
  const groups = {
    CowMorning: [],
    CowEvening: [],
    BuffaloMorning: [],
    BuffaloEvening: [],
  };

  const source =
    bill.collections ||
    bill.items ||
    [];

  source.forEach((item) => {
    const key =
      `${item.milkType}${item.session}`;

    if (groups[key]) {
      groups[key].push(item);
    }
  });

  return groups;
}

function calculateCollectionTotal(
  records
) {
  return records.reduce(
    (summary, item) => {
      summary.litres +=
        numberValue(
          item.quantity
        );

      summary.amount +=
        numberValue(
          item.amount
        );

      return summary;
    },
    {
      litres: 0,
      amount: 0,
    }
  );
}

function collectionRows(records) {
  if (!records.length) {
    return `
      <tr class="empty-row">
        <td colspan="6">
          No milk collected
        </td>
      </tr>
    `;
  }

  return records
    .map(
      (item) => `
        <tr>
          <td>
            ${escapeHtml(
              formatDate(
                item.collectionDate
              )
            )}
          </td>

          <td>
            ${money(
              item.quantity
            )}
          </td>

          <td>
            ${money(
              item.fat
            )}
          </td>

          <td>
            ${money(
              item.snf
            )}
          </td>

          <td>
            ₹${money(
              item.rate
            )}
          </td>

          <td>
            ₹${money(
              item.amount
            )}
          </td>
        </tr>
      `
    )
    .join("");
}

function sessionTable(
  title,
  records
) {
  const total =
    calculateCollectionTotal(
      records
    );

  return `
    <section class="session-card">
      <div class="session-heading">
        <div>
          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${records.length}
            ${
              records.length === 1
                ? "entry"
                : "entries"
            }
          </span>
        </div>

        <div class="session-total">
          ${money(
            total.litres
          )} L
        </div>
      </div>

      <table class="session-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Litres</th>
            <th>FAT</th>
            <th>SNF</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          ${collectionRows(records)}
        </tbody>

        <tfoot>
          <tr>
            <th>
              Total
            </th>

            <th>
              ${money(
                total.litres
              )}
            </th>

            <th colspan="3"></th>

            <th>
              ₹${money(
                total.amount
              )}
            </th>
          </tr>
        </tfoot>
      </table>
    </section>
  `;
}

function numberToWordsBelowThousand(
  number
) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  let value = Math.floor(
    number
  );

  let words = "";

  if (value >= 100) {
    words +=
      `${ones[
        Math.floor(
          value / 100
        )
      ]} Hundred`;

    value %= 100;

    if (value > 0) {
      words += " ";
    }
  }

  if (value >= 20) {
    words +=
      tens[
        Math.floor(
          value / 10
        )
      ];

    value %= 10;

    if (value > 0) {
      words +=
        ` ${ones[value]}`;
    }
  } else if (value > 0) {
    words += ones[value];
  }

  return words.trim();
}

function numberToIndianWords(
  value
) {
  let number =
    Math.floor(
      numberValue(value)
    );

  if (number === 0) {
    return "Zero";
  }

  const sections = [];

  const crore =
    Math.floor(
      number / 10000000
    );

  number %= 10000000;

  const lakh =
    Math.floor(
      number / 100000
    );

  number %= 100000;

  const thousand =
    Math.floor(
      number / 1000
    );

  number %= 1000;

  if (crore > 0) {
    sections.push(
      `${numberToWordsBelowThousand(
        crore
      )} Crore`
    );
  }

  if (lakh > 0) {
    sections.push(
      `${numberToWordsBelowThousand(
        lakh
      )} Lakh`
    );
  }

  if (thousand > 0) {
    sections.push(
      `${numberToWordsBelowThousand(
        thousand
      )} Thousand`
    );
  }

  if (number > 0) {
    sections.push(
      numberToWordsBelowThousand(
        number
      )
    );
  }

  return sections.join(" ");
}

function amountInWords(value) {
  const amount =
    numberValue(value);

  const rupees =
    Math.floor(amount);

  const paise =
    Math.round(
      (amount - rupees) * 100
    );

  let text =
    `Rupees ${numberToIndianWords(
      rupees
    )}`;

  if (paise > 0) {
    text +=
      ` and ${numberToIndianWords(
        paise
      )} Paise`;
  }

  return `${text} Only`;
}

function paymentStatusClass(
  status
) {
  const normalized =
    String(
      status || "Pending"
    )
      .toLowerCase()
      .replaceAll(" ", "-");

  return `status-${normalized}`;
}

function memberBillHtml(bill) {
  const groups =
    groupCollections(bill);

  const buffaloMorning =
    calculateCollectionTotal(
      groups.BuffaloMorning
    );

  const buffaloEvening =
    calculateCollectionTotal(
      groups.BuffaloEvening
    );

  const cowMorning =
    calculateCollectionTotal(
      groups.CowMorning
    );

  const cowEvening =
    calculateCollectionTotal(
      groups.CowEvening
    );

  const buffaloLitres =
    buffaloMorning.litres +
    buffaloEvening.litres;

  const buffaloAmount =
    buffaloMorning.amount +
    buffaloEvening.amount;

  const cowLitres =
    cowMorning.litres +
    cowEvening.litres;

  const cowAmount =
    cowMorning.amount +
    cowEvening.amount;

  const milkAmount =
    numberValue(
      bill.milkAmount
    );

  const reserveAmount =
    numberValue(
      bill.reserveAmount
    );

  const feedDeducted =
    numberValue(
      bill.feedDeducted
    );

  const advanceDeducted =
    numberValue(
      bill.advanceDeducted
    );

  const otherDeduction =
    numberValue(
      bill.otherDeduction
    );

  const totalDeduction =
    numberValue(
      bill.totalDeduction
    );

  const netPayable =
    numberValue(
      bill.netPayable
    );

  const paidAmount =
    numberValue(
      bill.paidAmount
    );

  const balanceAmount =
    numberValue(
      bill.balanceAmount
    );

  return `
    <article class="member-bill-print">
      <header class="bill-header">
        <div class="brand-block">
          <div class="brand-logo">
            🥛
          </div>

          <div>
            <h1>
              Dairy Management System
            </h1>

            <p>
              Milk Collection and Billing Centre
            </p>

            <small>
              Professional 10-Day Milk Settlement Bill
            </small>
          </div>
        </div>

        <div class="bill-meta">
          <div>
            <span>Bill Number</span>

            <strong>
              ${escapeHtml(
                bill.billNumber ||
                "Not Available"
              )}
            </strong>
          </div>

          <div class="meta-grid">
            <p>
              <span>
                Generated Date
              </span>

              <strong>
                ${escapeHtml(
                  getCurrentDate()
                )}
              </strong>
            </p>

            <p>
              <span>
                Billing Period
              </span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    bill.periodFrom
                  )
                )}
                to
                ${escapeHtml(
                  formatDate(
                    bill.periodTo
                  )
                )}
              </strong>
            </p>
          </div>
        </div>
      </header>

      <section class="member-details">
        <div>
          <span>
            Member ID
          </span>

          <strong>
            ${escapeHtml(
              bill.memberId
            )}
          </strong>
        </div>

        <div class="member-name">
          <span>
            Member Name
          </span>

          <strong>
            ${escapeHtml(
              bill.memberName
            )}
          </strong>
        </div>

        <div>
          <span>
            Village
          </span>

          <strong>
            ${escapeHtml(
              bill.village ||
              "-"
            )}
          </strong>
        </div>

        <div>
          <span>
            Mobile
          </span>

          <strong>
            ${escapeHtml(
              bill.mobile ||
              "-"
            )}
          </strong>
        </div>

        <div>
          <span>
            Payment Status
          </span>

          <strong
            class="payment-status ${paymentStatusClass(
              bill.status
            )}"
          >
            ${escapeHtml(
              bill.status ||
              "Pending"
            )}
          </strong>
        </div>
      </section>

      <section class="milk-section">
        <div class="milk-section-heading">
          <div>
            <span class="animal-icon">
              🐃
            </span>

            <h2>
              म्हैस दूध
              <small>
                Buffalo Milk
              </small>
            </h2>
          </div>

          <div class="animal-total">
            <span>
              Total
            </span>

            <strong>
              ${money(
                buffaloLitres
              )} L
              ·
              ₹${money(
                buffaloAmount
              )}
            </strong>
          </div>
        </div>

        <div class="session-grid">
          ${sessionTable(
            "Morning Session",
            groups.BuffaloMorning
          )}

          ${sessionTable(
            "Evening Session",
            groups.BuffaloEvening
          )}
        </div>
      </section>

      <section class="milk-section">
        <div class="milk-section-heading cow-heading">
          <div>
            <span class="animal-icon">
              🐄
            </span>

            <h2>
              गाय दूध
              <small>
                Cow Milk
              </small>
            </h2>
          </div>

          <div class="animal-total">
            <span>
              Total
            </span>

            <strong>
              ${money(
                cowLitres
              )} L
              ·
              ₹${money(
                cowAmount
              )}
            </strong>
          </div>
        </div>

        <div class="session-grid">
          ${sessionTable(
            "Morning Session",
            groups.CowMorning
          )}

          ${sessionTable(
            "Evening Session",
            groups.CowEvening
          )}
        </div>
      </section>

      <section class="animal-summary-strip">
        <div>
          <span>
            Buffalo Total
          </span>

          <strong>
            ${money(
              buffaloLitres
            )} L
          </strong>

          <small>
            ₹${money(
              buffaloAmount
            )}
          </small>
        </div>

        <div>
          <span>
            Cow Total
          </span>

          <strong>
            ${money(
              cowLitres
            )} L
          </strong>

          <small>
            ₹${money(
              cowAmount
            )}
          </small>
        </div>

        <div>
          <span>
            Combined Milk
          </span>

          <strong>
            ${money(
              bill.totalMilk
            )} L
          </strong>

          <small>
            ₹${money(
              milkAmount
            )}
          </small>
        </div>

        <div>
          <span>
            Average FAT
          </span>

          <strong>
            ${money(
              bill.averageFat
            )}
          </strong>
        </div>

        <div>
          <span>
            Average SNF
          </span>

          <strong>
            ${money(
              bill.averageSnf
            )}
          </strong>
        </div>
      </section>

      <section class="settlement-layout">
        <div class="deduction-information">
          <div class="detail-card reserve-card">
            <h3>
              ठेव माहिती
              <small>
                Reserve
              </small>
            </h3>

            <p>
              <span>
                Reserve Percentage
              </span>

              <strong>
                ${money(
                  bill.reservePercent
                )}%
              </strong>
            </p>

            <p>
              <span>
                Reserve Amount
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  reserveAmount
                )}
              </strong>
            </p>
          </div>

          <div class="detail-card">
            <h3>
              खाद्य माहिती
              <small>
                Feed
              </small>
            </h3>

            <p>
              <span>
                Feed Due
              </span>

              <strong>
                ₹${money(
                  bill.feedDue
                )}
              </strong>
            </p>

            <p>
              <span>
                Feed Deducted
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  feedDeducted
                )}
              </strong>
            </p>

            <p>
              <span>
                Remaining Feed
              </span>

              <strong>
                ₹${money(
                  Math.max(
                    numberValue(
                      bill.feedDue
                    ) -
                    feedDeducted,
                    0
                  )
                )}
              </strong>
            </p>
          </div>

          <div class="detail-card">
            <h3>
              एडव्हान्स माहिती
              <small>
                Advance
              </small>
            </h3>

            <p>
              <span>
                Advance Due
              </span>

              <strong>
                ₹${money(
                  bill.advanceDue
                )}
              </strong>
            </p>

            <p>
              <span>
                Advance Deducted
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  advanceDeducted
                )}
              </strong>
            </p>

            <p>
              <span>
                Remaining Advance
              </span>

              <strong>
                ₹${money(
                  Math.max(
                    numberValue(
                      bill.advanceDue
                    ) -
                    advanceDeducted,
                    0
                  )
                )}
              </strong>
            </p>
          </div>

          <div class="detail-card">
            <h3>
              इतर माहिती
              <small>
                Other
              </small>
            </h3>

            <p>
              <span>
                Other Deduction
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  otherDeduction
                )}
              </strong>
            </p>

            <p>
              <span>
                Paid Amount
              </span>

              <strong
                class="received-amount"
              >
                ₹${money(
                  paidAmount
                )}
              </strong>
            </p>
          </div>
        </div>

        <div class="final-settlement">
          <div class="final-heading">
            <div>
              <span>
                अंतिम बिल
              </span>

              <h2>
                Final Settlement
              </h2>
            </div>

            <div
              class="final-status ${paymentStatusClass(
                bill.status
              )}"
            >
              ${escapeHtml(
                bill.status ||
                "Pending"
              )}
            </div>
          </div>

          <div class="settlement-rows">
            <p>
              <span>
                Milk Amount
              </span>

              <strong>
                ₹${money(
                  milkAmount
                )}
              </strong>
            </p>

            <p>
              <span>
                Reserve
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  reserveAmount
                )}
              </strong>
            </p>

            <p>
              <span>
                Feed Deduction
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  feedDeducted
                )}
              </strong>
            </p>

            <p>
              <span>
                Advance Deduction
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  advanceDeducted
                )}
              </strong>
            </p>

            <p>
              <span>
                Other Deduction
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  otherDeduction
                )}
              </strong>
            </p>

            <p class="total-deduction-row">
              <span>
                Total Deduction
              </span>

              <strong
                class="deduction-amount"
              >
                - ₹${money(
                  totalDeduction
                )}
              </strong>
            </p>

            <p class="net-payable-row">
              <span>
                Net Payable
              </span>

              <strong
                class="payable-amount"
              >
                ₹${money(
                  netPayable
                )}
              </strong>
            </p>

            <p>
              <span>
                Paid Amount
              </span>

              <strong
                class="received-amount"
              >
                ₹${money(
                  paidAmount
                )}
              </strong>
            </p>

            <p class="balance-row">
              <span>
                Remaining Balance
              </span>

              <strong
                class="balance-amount"
              >
                ₹${money(
                  balanceAmount
                )}
              </strong>
            </p>
          </div>
        </div>
      </section>

      <section class="amount-words">
        <span>
          Amount in Words
        </span>

        <strong>
          ${escapeHtml(
            amountInWords(
              netPayable
            )
          )}
        </strong>
      </section>

      <section class="signature-row">
        <div>
          <span>
            Member Signature
          </span>
        </div>

        <div>
          <span>
            Operator Signature
          </span>
        </div>

        <div>
          <span>
            Authorized Signature
          </span>
        </div>
      </section>

      <footer class="bill-footer">
        <span>
          This is a computer-generated bill.
        </span>

        <span>
          Bill:
          ${escapeHtml(
            bill.billNumber ||
            "-"
          )}
        </span>
      </footer>
    </article>
  `;
}

function paymentRegisterHtml({
  bills,
  fromDate,
  toDate,
  totals,
}) {
  const rows =
    bills
      .map(
        (bill) => `
          <tr>
            <td>
              ${escapeHtml(
                bill.memberId
              )}
            </td>

            <td class="left">
              ${escapeHtml(
                bill.memberName
              )}
            </td>

            <td>
              ${money(
                bill.buffaloMilk
              )}
            </td>

            <td>
              ${money(
                bill.buffaloAmount
              )}
            </td>

            <td>
              ${money(
                bill.cowMilk
              )}
            </td>

            <td>
              ${money(
                bill.cowAmount
              )}
            </td>

            <td>
              ${money(
                bill.milkAmount
              )}
            </td>

            <td>
              ${money(
                bill.reserveAmount
              )}
            </td>

            <td>
              ${money(
                bill.feedDeducted
              )}
            </td>

            <td>
              ${money(
                bill.advanceDeducted
              )}
            </td>

            <td>
              ${money(
                bill.totalDeduction
              )}
            </td>

            <td>
              ${money(
                bill.netPayable
              )}
            </td>

            <td>
              ${money(
                bill.paidAmount
              )}
            </td>

            <td>
              ${money(
                bill.balanceAmount
              )}
            </td>
          </tr>
        `
      )
      .join("");

  return `
    <article class="payment-register-print">
      <h1>
        कालावधी:
        ${escapeHtml(
          formatDate(fromDate)
        )}
        ते
        ${escapeHtml(
          formatDate(toDate)
        )}
      </h1>

      <table class="register-table">
        <thead>
          <tr>
            <th>खाते</th>
            <th>नाव</th>
            <th>म्हैस लि.</th>
            <th>म्हैस ₹</th>
            <th>गाय लि.</th>
            <th>गाय ₹</th>
            <th>बिल</th>
            <th>ठेव</th>
            <th>खाद्य</th>
            <th>एडव्हान्स</th>
            <th>कपात</th>
            <th>निव्वळ</th>
            <th>भरले</th>
            <th>बाकी</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>

        <tfoot>
          <tr>
            <th colspan="2">
              Total
            </th>

            <th>
              ${money(
                totals.buffaloMilk
              )}
            </th>

            <th>
              ${money(
                totals.buffaloAmount
              )}
            </th>

            <th>
              ${money(
                totals.cowMilk
              )}
            </th>

            <th>
              ${money(
                totals.cowAmount
              )}
            </th>

            <th>
              ${money(
                totals.milkAmount
              )}
            </th>

            <th>
              ${money(
                totals.reserveAmount
              )}
            </th>

            <th>
              ${money(
                totals.feedDeducted
              )}
            </th>

            <th>
              ${money(
                totals.advanceDeducted
              )}
            </th>

            <th>
              ${money(
                totals.totalDeduction
              )}
            </th>

            <th>
              ${money(
                totals.netPayable
              )}
            </th>

            <th>
              ${money(
                totals.paidAmount
              )}
            </th>

            <th>
              ${money(
                totals.balanceAmount
              )}
            </th>
          </tr>
        </tfoot>
      </table>

      <section class="register-summary-grid">
        <div>
          <h3>
            गाय माहिती
          </h3>

          <p>
            Total Cow Litres:
            <strong>
              ${money(
                totals.cowMilk
              )}
            </strong>
          </p>

          <p>
            Total Cow Amount:
            <strong>
              ₹${money(
                totals.cowAmount
              )}
            </strong>
          </p>
        </div>

        <div>
          <h3>
            म्हैस माहिती
          </h3>

          <p>
            Total Buffalo Litres:
            <strong>
              ${money(
                totals.buffaloMilk
              )}
            </strong>
          </p>

          <p>
            Total Buffalo Amount:
            <strong>
              ₹${money(
                totals.buffaloAmount
              )}
            </strong>
          </p>
        </div>

        <div>
          <h3>
            एकूण माहिती
          </h3>

          <p>
            Total Litres:
            <strong>
              ${money(
                totals.totalMilk
              )}
            </strong>
          </p>

          <p>
            Total Milk Amount:
            <strong>
              ₹${money(
                totals.milkAmount
              )}
            </strong>
          </p>
        </div>

        <div>
          <h3>
            एकूण संक्षेप
          </h3>

          <p>
            Total Deduction:
            <strong>
              ₹${money(
                totals.totalDeduction
              )}
            </strong>
          </p>

          <p>
            Net Payable:
            <strong>
              ₹${money(
                totals.netPayable
              )}
            </strong>
          </p>

          <p>
            Balance:
            <strong>
              ₹${money(
                totals.balanceAmount
              )}
            </strong>
          </p>
        </div>
      </section>
    </article>
  `;
}

function createDocument(
  body,
  title,
  options = {}
) {
  const {
    landscape = true,
    memberBill = false,
  } = options;

  return `
    <!doctype html>

    <html>
      <head>
        <meta charset="utf-8" />

        <title>
          ${escapeHtml(title)}
        </title>

        <style>
          @page {
            size:
              A4
              ${landscape
                ? "landscape"
                : "portrait"};

            margin:
              ${memberBill
                ? "6mm"
                : "8mm"};
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
          }

          body {
            color: #111827;
            background: #ffffff;

            font-family:
              Arial,
              "Noto Sans Devanagari",
              sans-serif;
          }

          h1,
          h2,
          h3,
          p {
            margin-top: 0;
          }

          /* MEMBER BILL */

          .member-bill-print {
            width: 100%;
            min-height: 190mm;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .bill-header {
            display: flex;
            justify-content:
              space-between;
            gap: 20px;

            padding: 8px 10px;

            border:
              1.5px solid #0f172a;

            border-radius: 7px;

            background:
              linear-gradient(
                135deg,
                #eff6ff,
                #ffffff
              );
          }

          .brand-block {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand-logo {
            width: 46px;
            height: 46px;

            display: flex;
            align-items: center;
            justify-content: center;

            border:
              1px solid #bfdbfe;

            border-radius: 10px;

            background: #dbeafe;

            font-size: 24px;
          }

          .brand-block h1 {
            margin: 0;

            color: #0f172a;
            font-size: 20px;
          }

          .brand-block p {
            margin: 3px 0 0;

            color: #334155;
            font-size: 10px;
            font-weight: 700;
          }

          .brand-block small {
            display: block;
            margin-top: 2px;

            color: #64748b;
            font-size: 8px;
          }

          .bill-meta {
            min-width: 360px;
            text-align: right;
          }

          .bill-meta > div:first-child {
            padding-bottom: 5px;

            border-bottom:
              1px solid #cbd5e1;
          }

          .bill-meta span {
            display: block;

            color: #64748b;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .bill-meta strong {
            display: block;
            margin-top: 2px;

            max-width: 390px;

            overflow-wrap: anywhere;

            color: #0f172a;
            font-size: 11px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns:
              repeat(2, 1fr);

            gap: 10px;
            margin-top: 5px;
          }

          .meta-grid p {
            margin: 0;
          }

          .member-details {
            display: grid;
            grid-template-columns:
              0.7fr
              1.5fr
              1fr
              1fr
              1fr;

            border:
              1px solid #64748b;

            border-radius: 6px;

            overflow: hidden;
          }

          .member-details > div {
            min-height: 43px;
            padding: 6px 8px;

            border-right:
              1px solid #94a3b8;
          }

          .member-details > div:last-child {
            border-right: none;
          }

          .member-details span {
            display: block;

            color: #64748b;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .member-details strong {
            display: block;
            margin-top: 4px;

            color: #0f172a;
            font-size: 11px;
          }

          .member-name strong {
            font-size: 12px;
          }

          .payment-status {
            display: inline-flex !important;
            width: fit-content;

            padding: 3px 7px;

            border-radius: 999px;

            font-size: 8px !important;
          }

          .status-paid {
            background: #dcfce7;
            color: #15803d !important;
          }

          .status-partially-paid {
            background: #dbeafe;
            color: #1d4ed8 !important;
          }

          .status-pending {
            background: #fef3c7;
            color: #92400e !important;
          }

          .status-cancelled {
            background: #fee2e2;
            color: #b91c1c !important;
          }

          .milk-section {
            border:
              1px solid #64748b;

            border-radius: 7px;

            overflow: hidden;

            break-inside: avoid;
          }

          .milk-section-heading {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 15px;

            padding: 5px 9px;

            background: #dbeafe;
          }

          .cow-heading {
            background: #dcfce7;
          }

          .milk-section-heading > div:first-child {
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .animal-icon {
            font-size: 17px;
          }

          .milk-section-heading h2 {
            margin: 0;

            color: #0f172a;
            font-size: 12px;
          }

          .milk-section-heading h2 small {
            margin-left: 5px;

            color: #475569;
            font-size: 8px;
            font-weight: 600;
          }

          .animal-total {
            text-align: right;
          }

          .animal-total span {
            display: block;

            color: #64748b;
            font-size: 7px;
          }

          .animal-total strong {
            display: block;
            margin-top: 2px;

            color: #0f172a;
            font-size: 10px;
          }

          .session-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .session-card:first-child {
            border-right:
              1px solid #64748b;
          }

          .session-heading {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 10px;

            padding: 4px 7px;

            border-bottom:
              1px solid #94a3b8;

            background: #f8fafc;
          }

          .session-heading strong {
            display: block;

            font-size: 9px;
          }

          .session-heading span {
            display: block;
            margin-top: 1px;

            color: #64748b;
            font-size: 6px;
          }

          .session-total {
            color: #2563eb;
            font-size: 9px;
            font-weight: 800;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          .session-table th,
          .session-table td {
            padding: 3px 4px;

            border-right:
              1px solid #94a3b8;

            border-bottom:
              1px solid #94a3b8;

            text-align: center;

            font-size: 7px;
          }

          .session-table th:last-child,
          .session-table td:last-child {
            border-right: none;
          }

          .session-table thead th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 800;
            text-transform: uppercase;
          }

          .session-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .session-table tfoot th {
            background: #e2e8f0;
            color: #0f172a;
          }

          .empty-row td {
            padding: 7px;

            color: #94a3b8;
            font-style: italic;
          }

          .animal-summary-strip {
            display: grid;
            grid-template-columns:
              repeat(5, 1fr);

            border:
              1px solid #64748b;

            border-radius: 7px;

            overflow: hidden;
          }

          .animal-summary-strip > div {
            min-height: 43px;
            padding: 5px 8px;

            border-right:
              1px solid #94a3b8;

            background: #ffffff;
          }

          .animal-summary-strip > div:last-child {
            border-right: none;
          }

          .animal-summary-strip span,
          .animal-summary-strip strong,
          .animal-summary-strip small {
            display: block;
          }

          .animal-summary-strip span {
            color: #64748b;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .animal-summary-strip strong {
            margin-top: 3px;

            color: #0f172a;
            font-size: 10px;
          }

          .animal-summary-strip small {
            margin-top: 1px;

            color: #475569;
            font-size: 7px;
          }

          .settlement-layout {
            display: grid;
            grid-template-columns:
              minmax(0, 2.6fr)
              minmax(310px, 1.4fr);

            gap: 7px;

            break-inside: avoid;
          }

          .deduction-information {
            display: grid;
            grid-template-columns:
              repeat(4, 1fr);

            border:
              1px solid #64748b;

            border-radius: 7px;

            overflow: hidden;
          }

          .detail-card {
            min-height: 128px;
            padding: 7px;

            border-right:
              1px solid #94a3b8;

            background: #ffffff;
          }

          .detail-card:last-child {
            border-right: none;
          }

          .detail-card h3 {
            margin: -7px -7px 7px;
            padding: 5px;

            background: #e2e8f0;

            text-align: center;
            font-size: 9px;
          }

          .detail-card h3 small {
            display: block;
            margin-top: 1px;

            color: #64748b;
            font-size: 6px;
          }

          .detail-card p {
            display: flex;
            justify-content:
              space-between;
            gap: 7px;

            margin: 5px 0;
          }

          .detail-card span {
            color: #64748b;
            font-size: 7px;
          }

          .detail-card strong {
            color: #0f172a;
            font-size: 8px;
          }

          .reserve-card {
            background: #fffbeb;
          }

          .final-settlement {
            padding: 8px 10px;

            border:
              1.5px solid #0f172a;

            border-radius: 7px;

            background:
              linear-gradient(
                180deg,
                #f8fafc,
                #ffffff
              );
          }

          .final-heading {
            display: flex;
            align-items: center;
            justify-content:
              space-between;
            gap: 10px;

            padding-bottom: 6px;

            border-bottom:
              1px solid #cbd5e1;
          }

          .final-heading span {
            display: block;

            color: #64748b;
            font-size: 7px;
            font-weight: 700;
          }

          .final-heading h2 {
            margin: 2px 0 0;

            color: #0f172a;
            font-size: 13px;
          }

          .final-status {
            padding: 4px 7px;

            border-radius: 999px;

            font-size: 7px;
            font-weight: 800;
          }

          .settlement-rows {
            margin-top: 5px;
          }

          .settlement-rows p {
            display: flex;
            justify-content:
              space-between;
            gap: 10px;

            margin: 0;
            padding: 3px 0;

            border-bottom:
              1px dashed #e2e8f0;
          }

          .settlement-rows span {
            color: #475569;
            font-size: 7px;
          }

          .settlement-rows strong {
            color: #0f172a;
            font-size: 8px;
          }

          .total-deduction-row {
            margin-top: 2px !important;

            border-top:
              1px solid #cbd5e1;
          }

          .net-payable-row {
            margin-top: 2px !important;
            padding: 5px 0 !important;

            border-top:
              1.5px solid #0f172a;

            border-bottom:
              1.5px solid #0f172a !important;
          }

          .balance-row {
            border-bottom: none !important;
          }

          .deduction-amount {
            color: #dc2626 !important;
          }

          .received-amount {
            color: #2563eb !important;
          }

          .payable-amount {
            color: #15803d !important;
            font-size: 13px !important;
            font-weight: 900;
          }

          .balance-amount {
            color: #b45309 !important;
            font-size: 10px !important;
          }

          .amount-words {
            display: flex;
            align-items: center;
            gap: 10px;

            padding: 6px 9px;

            border:
              1px solid #64748b;

            border-radius: 6px;

            background: #f8fafc;
          }

          .amount-words span {
            color: #64748b;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .amount-words strong {
            color: #0f172a;
            font-size: 8px;
          }

          .signature-row {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);

            gap: 30px;
            margin-top: auto;
            padding-top: 17px;
          }

          .signature-row > div {
            padding-top: 5px;

            border-top:
              1px solid #0f172a;

            text-align: center;
          }

          .signature-row span {
            color: #475569;
            font-size: 7px;
            font-weight: 700;
          }

          .bill-footer {
            display: flex;
            justify-content:
              space-between;
            gap: 20px;

            padding-top: 4px;

            border-top:
              1px solid #cbd5e1;

            color: #64748b;
            font-size: 6px;
          }

          /* PAYMENT REGISTER */

          .payment-register-print h1 {
            margin-bottom: 8px;

            text-align: center;
            font-size: 16px;
          }

          .register-table th,
          .register-table td {
            padding: 3px 2px;

            border:
              1px solid #111827;

            text-align: center;

            font-size: 7px;
          }

          .register-table thead th {
            background: #38bdf8;
          }

          .register-table tfoot th {
            background: #bae6fd;
          }

          .left {
            text-align: left;
          }

          .register-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(4, 1fr);

            margin-top: 8px;
          }

          .register-summary-grid > div {
            min-height: 80px;
            padding: 6px;

            border:
              1px solid #111827;
          }

          .register-summary-grid h3 {
            margin-bottom: 6px;

            background: #bae6fd;

            text-align: center;
            font-size: 11px;
          }

          .register-summary-grid p {
            display: flex;
            justify-content:
              space-between;

            margin: 5px 0;

            font-size: 9px;
          }
        </style>
      </head>

      <body>
        ${body}

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `;
}

function openPrintWindow(html) {
  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1400,height=950"
    );

  if (!printWindow) {
    throw new Error(
      "Print pop-up was blocked. Allow pop-ups for localhost and try again."
    );
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printSingleBill(
  bill
) {
  if (!bill) {
    throw new Error(
      "No bill is available to print."
    );
  }

  openPrintWindow(
    createDocument(
      memberBillHtml(bill),
      bill.billNumber ||
        "Member Bill",
      {
        landscape: true,
        memberBill: true,
      }
    )
  );
}

export function printAllBills(
  bills
) {
  if (
    !Array.isArray(bills) ||
    bills.length === 0
  ) {
    throw new Error(
      "No bills are available to print."
    );
  }

  const content =
    bills
      .map(
        (bill, index) => `
          <div
            style="
              page-break-after:
                ${
                  index ===
                  bills.length - 1
                    ? "auto"
                    : "always"
                };
            "
          >
            ${memberBillHtml(bill)}
          </div>
        `
      )
      .join("");

  openPrintWindow(
    createDocument(
      content,
      "All Member Bills",
      {
        landscape: true,
        memberBill: true,
      }
    )
  );
}

export function printPaymentRegister(
  data
) {
  if (
    !data.bills ||
    data.bills.length === 0
  ) {
    throw new Error(
      "No payment register records are available to print."
    );
  }

  openPrintWindow(
    createDocument(
      paymentRegisterHtml(data),
      "Payment Register",
      {
        landscape: true,
        memberBill: false,
      }
    )
  );
}
