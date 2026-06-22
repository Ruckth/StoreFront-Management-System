import { LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../hooks/useAuth";

type LocationState = {
  from?: { pathname?: string };
};

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      const destination =
        state?.from?.pathname ??
        (user.role === "seller" ? "/seller/products" : "/products");
      navigate(destination, { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Login failed. Check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
      </div>
      {error ? <StatusMessage title="Could not login" message={error} tone="error" /> : null}
      <form className="form-grid single-column" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <LogIn aria-hidden="true" size={18} />
          {isSubmitting ? "Logging in" : "Login"}
        </button>
      </form>
      <p className="inline-help">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
