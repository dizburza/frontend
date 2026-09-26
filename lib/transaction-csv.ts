import type { ApiTransaction } from "@/lib/api/organization";

const HEADERS = [
  "Date",
  "Type",
  "Description",
  "From / To",
  "Amount",
  "Status",
  "Transaction hash",
];

/** Quote everything: descriptions and names are free text and carry commas. */
const cell = (value: string) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const counterpartyOf = (tx: ApiTransaction) => {
  const inflow = tx.direction === "received";
  const user = inflow ? tx.fromUser : tx.toUser;
  const address = inflow ? tx.fromAddress : tx.toAddress;
  return user?.fullName || (user?.username ? `@${user.username}` : address || "");
};

export function buildTransactionCsv(transactions: ApiTransaction[], symbol: string) {
  const rows = transactions.map((tx) =>
    [
      tx.timestamp ? new Date(tx.timestamp).toISOString() : "",
      tx.direction === "received" ? "Received" : "Sent",
      tx.description || tx.memo || "",
      counterpartyOf(tx),
      // Already scaled by the backend, so the browser never needs the decimals.
      `${String(tx.displayAmount || "0").replaceAll(/[+-]/g, "")} ${symbol}`.trim(),
      tx.status === "confirmed" ? "Completed" : tx.status,
      tx.txHash || "",
    ]
      .map(cell)
      .join(",")
  );

  return [HEADERS.map(cell).join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
