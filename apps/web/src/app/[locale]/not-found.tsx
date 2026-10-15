import { NotFoundView } from "@/components/not-found-view";

// Pages that call notFound() (e.g. a document that no longer exists) keep the site header and footer.
export default function LocaleNotFound() {
  return <NotFoundView />;
}
