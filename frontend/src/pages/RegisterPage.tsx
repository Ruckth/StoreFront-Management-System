import { UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
    <Card className="mx-auto w-[min(680px,100%)]">
      <CardHeader>
        <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
          Create account
        </p>
        <CardTitle className="text-3xl">Register</CardTitle>
        <CardDescription>
          Pick your starting workspace. Buyer accounts shop products; seller accounts manage
          listings.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not register</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <fieldset className="grid gap-2 border-0 p-0">
            <legend className="text-sm font-bold text-muted-foreground">Role</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full border bg-muted p-1">
              <button
                type="button"
                className={`min-h-10 rounded-full px-4 text-sm font-extrabold transition-colors ${
                  role === "buyer"
                    ? "bg-foreground text-background"
                    : "bg-transparent text-foreground"
                }`}
                aria-pressed={role === "buyer"}
                onClick={() => setRole("buyer")}
              >
                Buyer
              </button>
              <button
                type="button"
                className={`min-h-10 rounded-full px-4 text-sm font-extrabold transition-colors ${
                  role === "seller"
                    ? "bg-foreground text-background"
                    : "bg-transparent text-foreground"
                }`}
                aria-pressed={role === "seller"}
                onClick={() => setRole("seller")}
              >
                Seller
              </button>
            </div>
          </fieldset>
          <div className="grid gap-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="min-h-10 rounded-full text-sm font-extrabold"
            disabled={isSubmitting}
          >
            <UserPlus aria-hidden="true" />
            {isSubmitting ? "Creating account" : "Register"}
          </Button>
        </form>
        <p className="text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-primary">
            Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
