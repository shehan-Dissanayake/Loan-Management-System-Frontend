// ESC/POS command bytes for 58mm thermal printers
const ESC = 0x1b;
const GS  = 0x1d;

export function buildReceipt(data) {
  const bytes = [];

  const push    = (...args) => bytes.push(...args);
  const text    = (str) => { for (let i = 0; i < str.length; i++) push(str.charCodeAt(i)); };
  const newline = (n = 1) => { for (let i = 0; i < n; i++) push(0x0a); };

  // Left-pad a number to produce "001", "002", etc.
  const padNum = (n, width = 3) => String(n).padStart(width, '0');

  // Two-column row: label left, value right — total 32 chars wide
  const row = (label, value, totalWidth = 32) => {
    const gap = Math.max(1, totalWidth - label.length - String(value).length);
    text(label + ' '.repeat(gap) + value);
    newline();
  };

  // ── Initialize printer ────────────────────────────────────────────────────
  push(ESC, 0x40);

  // ── Header ────────────────────────────────────────────────────────────────
  push(ESC, 0x61, 0x01);          // center align
  push(ESC, 0x21, 0x30);          // double-height + bold
  text('Rohana Credit');
  newline();

  push(ESC, 0x21, 0x00);          // normal
  text('Payment Receipt');
  newline();
  text('078 673 0312');
  newline();

  // ── Divider ───────────────────────────────────────────────────────────────
  push(ESC, 0x61, 0x00);          // left align
  text('--------------------------------');
  newline();

  // ── Customer ──────────────────────────────────────────────────────────────
  text('Customer');
  newline();
  push(ESC, 0x21, 0x08);          // bold
  text(data.shopName.substring(0, 32));
  push(ESC, 0x21, 0x00);          // normal
  newline();
  newline(1);

  // ── Loan number (formatted as 001, 002 …) ────────────────────────────────
  text('Loan No.');
  newline();
  push(ESC, 0x21, 0x08);          // bold
  text(data.loanNumber != null ? padNum(data.loanNumber) : '---');
  push(ESC, 0x21, 0x00);          // normal
  newline();

  // ── Divider ───────────────────────────────────────────────────────────────
  text('--------------------------------');
  newline();

  // ── Loan term & dates ─────────────────────────────────────────────────────
  row('Duration',   '60 days');
  row('Open date',  data.openDate);
  row('Close date', data.closeDate);

  // ── Divider ───────────────────────────────────────────────────────────────
  text('--------------------------------');
  newline();

  // ── Financial summary ─────────────────────────────────────────────────────
  row('Loan Capital',      `Rs ${data.principalAmount}`);
  row('Total Amount',  `Rs ${data.totalPayable}`);
  row('Daily installment',  `Rs ${data.installmentAmount}`);

  // ── Divider ───────────────────────────────────────────────────────────────
  text('--------------------------------');
  newline();

  // ── Key payment figures (double-width) ────────────────────────────────────
  push(ESC, 0x21, 0x10);          // double width
  row('Paid today',  `Rs ${data.amountCollected}`);
  row('Balance due', `Rs ${data.balanceAfter}`);
  push(ESC, 0x21, 0x00);          // normal

  // ── Divider ───────────────────────────────────────────────────────────────
  text('--------------------------------');
  newline();

  // ── Arrears ───────────────────────────────────────────────────────────────
  row('Arrears days', String(data.arrearsCount ?? 0));
  row('Arrears amt',  `Rs ${data.arrearsAmount ?? '0.00'}`);

  // ── Divider ───────────────────────────────────────────────────────────────
  text('--------------------------------');
  newline();

  // ── Footer ────────────────────────────────────────────────────────────────
  text(`Printed: ${data.printedAt}`);
  newline();

  push(ESC, 0x61, 0x01);          // center
  text('Thank you');
  newline(3);

  // ── Partial cut ───────────────────────────────────────────────────────────
  push(GS, 0x56, 0x01);

  return new Uint8Array(bytes);
}