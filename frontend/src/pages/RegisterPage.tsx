import { UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { register } from "../lib/api";
import type { Role } from "../types";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register(email, password, role);
      navigate("/login", {
        replace: true,
        state: { registeredEmail: email },
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Registration failed. Check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
      </div>
      {error ? (
        <StatusMessage title="Could not register" message={error} tone="error" />
      ) : null}
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
        <fieldset className="segmented-field">
          <legend>Role</legend>
          <label>
            <input
              checked={role === "buyer"}
              name="role"
              type="radio"
              value="buyer"
              onChange={() => setRole("buyer")}
            />
            Buyer
          </label>
          <label>
            <input
              checked={role === "seller"}
              name="role"
              type="radio"
              value="seller"
              onChange={() => setRole("seller")}
            />
            Seller
          </label>
        </fieldset>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          <UserPlus aria-hidden="true" size={18} />
          {isSubmitting ? "Creating account" : "Register"}
        </button>
      </form>
      <p className="inline-help">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
