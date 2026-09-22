/**
 * Transaction history, off by default.
 *
 * Payroll is settled by the backend and nothing in the product waits on a
 * confirmed transfer to be readable, so the history endpoints were the slowest
 * part of every page for data nothing was doing anything with. They are still
 * recorded, still queryable, and turning this back on is one variable.
 *
 * Balances are deliberately not behind this: a treasury figure is one cheap
 * read and it is the number people actually look at.
 */
export const TRANSACTION_HISTORY_ENABLED =
  process.env.NEXT_PUBLIC_TRANSACTION_HISTORY === "true";
