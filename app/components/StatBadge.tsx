import { ReactNode } from "react";

interface StatBadgeProps {
  icon: ReactNode;
  value: string | number;
  label?: string;
}

export default function StatBadge({ icon, value, label }: StatBadgeProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-md font-semibold px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5">
      <span aria-label={label}>{icon}</span>
      <span>{value}</span>
    </div>
  );
}
