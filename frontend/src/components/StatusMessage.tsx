import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type StatusMessageProps = {
  title: string;
  message?: string;
  tone?: "neutral" | "error" | "success";
};

export function StatusMessage({
  title,
  message,
  tone = "neutral",
}: StatusMessageProps) {
  const variant = tone === "error" ? "destructive" : "default";

  return (
    <Alert
      variant={variant}
      role={tone === "error" ? "alert" : "status"}
      className={tone === "success" ? "border-green-600/25 bg-green-50 text-green-800" : ""}
    >
      <AlertTitle>{title}</AlertTitle>
      {message ? <AlertDescription>{message}</AlertDescription> : null}
    </Alert>
  );
}
