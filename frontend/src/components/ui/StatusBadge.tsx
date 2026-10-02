type StatusBadgeProps = {
  children: React.ReactNode
  tone?: "default" | "success" | "warning" | "info"
}

export function StatusBadge({
  children,
  tone = "default",
}: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${tone}`}>
      {children}
    </span>
  )
}
