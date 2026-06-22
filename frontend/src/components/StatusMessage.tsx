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
  return (
    <div className={`status-message status-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <strong>{title}</strong>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
