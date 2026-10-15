import { NotFoundView } from "@/components/not-found-view";

// Addresses that match no page at all.
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bb-bg)] px-4">
      <NotFoundView />
    </main>
  );
}
