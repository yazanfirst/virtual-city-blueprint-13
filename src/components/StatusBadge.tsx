import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "coming-soon" | "for-rent" | "taken";
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    "active": {
      label: "Active",
      className: "bg-primary/20 text-primary border-primary/40",
    },
    "coming-soon": {
      label: "Coming Soon",
      className: "bg-secondary/20 text-secondary border-secondary/40",
    },
    "for-rent": {
      label: "For Rent",
      className: "bg-green-500/20 text-green-400 border-green-500/40",
    },
    "taken": {
      label: "Taken",
      className: "bg-red-500/20 text-red-400 border-red-500/40",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider",
        config.className,
        className
      )}
    >
      <span className={cn(
        "mr-2 h-1.5 w-1.5 rounded-full",
        status === "active" && "bg-primary animate-pulse-glow",
        status === "coming-soon" && "bg-secondary",
        status === "for-rent" && "bg-green-400 animate-pulse-glow",
        status === "taken" && "bg-red-400"
      )} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
