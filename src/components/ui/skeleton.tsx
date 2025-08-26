import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-card-lg bg-muted", className)} // Applique le nouveau rayon de bordure
      {...props}
    />
  )
}

export { Skeleton }