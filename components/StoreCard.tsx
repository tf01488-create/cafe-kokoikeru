"use client";

import { useRouter } from "next/navigation";
import CrowdingBadge from "./CrowdingBadge";

type StoreCardProps = {
  storeId: number;
  storeName: string;
  status: string | null;
  reportCount: number;
  lastUpdated: string | null;
};

function formatTime(isoString: string | null): string | null {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tokyo",
    });
  } catch {
    return null;
  }
}

export default function StoreCard({
  storeId,
  storeName,
  status,
  reportCount,
  lastUpdated,
}: StoreCardProps) {
  const router = useRouter();
  const formattedTime = formatTime(lastUpdated);

  return (
    <div
      onClick={() => router.push(`/post?storeId=${storeId}`)}
      className="bg-white rounded-2xl shadow-sm border border-amber-200 p-5 cursor-pointer hover:shadow-md hover:border-amber-400 transition-all duration-200 active:scale-95"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          router.push(`/post?storeId=${storeId}`);
        }
      }}
    >
      <h2 className="text-lg font-bold text-amber-900 mb-3">{storeName}</h2>

      <div className="mb-3">
        {status ? (
          <CrowdingBadge status={status} />
        ) : (
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-500 border border-gray-200">
            情報なし
          </span>
        )}
      </div>

      <div className="text-sm text-amber-700 space-y-1">
        <p>直近1時間の報告: {reportCount}件</p>
        {formattedTime ? (
          <p>最終更新: {formattedTime}</p>
        ) : (
          <p className="text-gray-400">最終更新: —</p>
        )}
      </div>

      <div className="mt-3 text-xs text-amber-500 text-right">
        タップして報告する →
      </div>
    </div>
  );
}
