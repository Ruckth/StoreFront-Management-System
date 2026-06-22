import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex w-[min(680px,100%)] flex-col gap-4">
      <StatusMessage title="Page not found" message="The requested page does not exist." />
      <Button asChild>
        <Link to="/products">
          <Home aria-hidden="true" size={18} />
          Marketplace
        </Link>
      </Button>
    </section>
  );
}
