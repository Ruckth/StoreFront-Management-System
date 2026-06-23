import { LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    <Card className="mx-auto w-[min(680px,100%)]">
      <CardHeader>
        <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
          Welcome back
        </p>
        <CardTitle className="text-3xl">Login</CardTitle>
        <CardDescription>Access your buyer or seller workspace.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not login</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
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
            <LogIn aria-hidden="true" />
            {isSubmitting ? "Logging in" : "Login"}
          </Button>
        </form>
        <p className="text-muted-foreground">
          Need an account?{" "}
          <Link to="/register" className="font-bold text-primary">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
