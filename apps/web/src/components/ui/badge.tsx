export function Badge({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span className={`doc-badge${muted ? " doc-badge-muted" : ""}`}>
      {children}
    </span>
  );
}
