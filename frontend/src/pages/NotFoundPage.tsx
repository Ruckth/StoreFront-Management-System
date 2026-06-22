import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";

export function NotFoundPage() {
  return (
    <section className="page-stack narrow-page">
      <StatusMessage title="Page not found" message="The requested page does not exist." />
      <Link to="/products" className="primary-button">
        <Home aria-hidden="true" size={18} />
        Marketplace
      </Link>
    </section>
  );
}
