export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="ui-state">
      <p className="ui-state-title">{title}</p>
      {description ? <p className="ui-state-desc">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="ui-state" role="status" aria-live="polite">
      <p className="ui-state-title">{label}</p>
    </div>
  );
}

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="ui-state ui-state--error" role="alert">
      <p className="ui-state-title">{title}</p>
      {description ? <p className="ui-state-desc">{description}</p> : null}
    </div>
  );
}

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-banner ui-banner--success" role="status">
      {children}
    </div>
  );
}
