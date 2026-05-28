"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CrowdingBadge from "./CrowdingBadge";

type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'none';

type StoreCardProps = {
  storeId: number;
  storeName: string;
  status: string | null;
  reportCount: number;
  lastUpdated: string | null;
  freshnessLevel: FreshnessLevel;
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return `${diffDays}日前`;
}

export default function StoreCard({
  storeId,
  storeName,
  status,
  reportCount,
  lastUpdated,
  freshnessLevel,
}: StoreCardProps) {
  const router = useRouter();
  // Re-render every minute so relative times stay current
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const relativeTime = formatRelativeTime(lastUpdated);
  const isAging = freshnessLevel === 'aging';
  const isStale = freshnessLevel === 'stale';

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

      <div className="text-sm space-y-1">
        <p className="text-amber-700">直近1時間の報告: {reportCount}件</p>

        {lastUpdated ? (
          <p
            className={
              isStale || isAging ? 'text-amber-500' : 'text-amber-700'
            }
          >
            最終報告: {relativeTime}
          </p>
        ) : (
          <p className="text-gray-400">最終報告: —</p>
        )}

        {isStale && (
          <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
            <span>⚠</span> 情報が古いため「情報なし」として表示しています
          </p>
        )}
        {isAging && !isStale && (
          <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
            <span>⚠</span> 1時間以上前の情報です。変わっている可能性があります
          </p>
        )}
      </div>

      <div className="mt-3 text-xs text-amber-500 text-right">
        タップして報告する →
      </div>
    </div>
  );
}
