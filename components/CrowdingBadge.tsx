"use client";

type CrowdingBadgeProps = {
  status: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  空きあり: {
    label: "空きあり",
    className: "bg-green-100 text-green-800 border border-green-300",
  },
  混雑しているが空きあり: {
    label: "混雑しているが空きあり",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  },
  満席: {
    label: "満席",
    className: "bg-red-100 text-red-800 border border-red-300",
  },
};

export default function CrowdingBadge({ status }: CrowdingBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border border-gray-300",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
