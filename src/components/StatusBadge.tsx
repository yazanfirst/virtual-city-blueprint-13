import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "coming-soon" | "for-rent" | "taken" | "pending_review" | "rejected" | "suspended";
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    "active": {
      label: "Active",
      className: "bg-green-500/20 text-green-400 border-green-500/40",
    },
    "coming-soon": {
      label: "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    },
    "pending_review": {
      label: "Pending Review",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    },
    "for-rent": {
      label: "For Rent",
      className: "bg-primary/20 text-primary border-primary/40",
    },
    "taken": {
      label: "Taken",
      className: "bg-red-500/20 text-red-400 border-red-500/40",
    },
    "rejected": {
      label: "Rejected",
      className: "bg-red-500/20 text-red-400 border-red-500/40",
    },
    "suspended": {
      label: "Suspended",
      className: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    },
  };

  const config = statusConfig[status] || statusConfig["for-rent"];

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
        status === "active" && "bg-green-400 animate-pulse",
        (status === "coming-soon" || status === "pending_review") && "bg-yellow-400",
        status === "for-rent" && "bg-primary animate-pulse",
        status === "taken" && "bg-red-400",
        status === "rejected" && "bg-red-400",
        status === "suspended" && "bg-orange-400"
      )} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
