// "Bank · 0123…" line for vendor bankDetails / rider payoutDetails.
export function AccountCell({ account, provider }) {
  if (!account?.accountNumber) return <span className="muted">Not added</span>;
  return (
    <>
      <span className="cell-strong">{provider || account.accountTitle}</span>
      <span className="cell-sub">
        {account.accountNumber}
        {provider && account.accountTitle ? ` · ${account.accountTitle}` : ''}
      </span>
    </>
  );
}
