"use client";

import { useEffect, useState } from "react";
import StoreCard from "@/components/StoreCard";

type CrowdingEntry = {
  storeId: number;
  storeName: string;
  status: string;
  reportCount: number;
  lastUpdated: string | null;
};

type CrowdingListProps = {
  initialCrowding: CrowdingEntry[];
};

function CrowdingList({ initialCrowding }: CrowdingListProps) {
  const [crowding, setCrowding] = useState<CrowdingEntry[]>(initialCrowding);
  const [lastSseUpdate, setLastSseUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");

    es.onmessage = (event) => {
      try {
        const data: CrowdingEntry = JSON.parse(event.data);
        setCrowding((prev) =>
          prev.map((entry) =>
            entry.storeId === data.storeId ? { ...entry, ...data } : entry
          )
        );
        setLastSseUpdate(new Date());
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // SSE connection error — browser will auto-reconnect
    };

    return () => {
      es.close();
    };
  }, []);

  const formattedUpdateTime = lastSseUpdate
    ? lastSseUpdate.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Tokyo",
      })
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">
            カフェのリアルタイム混雑情報
          </h1>
          <p className="text-amber-700 text-sm mt-1">
            お客様からのリアルタイム報告に基づいています
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          {formattedUpdateTime ? (
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              {formattedUpdateTime} 更新
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              接続中...
            </div>
          )}
        </div>
      </div>

      {crowding.length === 0 ? (
        <div className="text-center py-16 text-amber-600">
          <p className="text-4xl mb-3">☕</p>
          <p className="text-lg font-medium">店舗情報を読み込んでいます...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crowding.map((entry) => (
            <StoreCard
              key={entry.storeId}
              storeId={entry.storeId}
              storeName={entry.storeName}
              status={entry.status ?? null}
              reportCount={entry.reportCount}
              lastUpdated={entry.lastUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [crowding, setCrowding] = useState<CrowdingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crowding")
      .then((res) => {
        if (!res.ok) throw new Error("データの取得に失敗しました");
        return res.json();
      })
      .then((data: { crowding: CrowdingEntry[] }) => {
        setCrowding(data.crowding);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-amber-600">
        <p className="text-5xl mb-4">☕</p>
        <p className="text-lg font-medium animate-pulse">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        <p className="text-lg font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return <CrowdingList initialCrowding={crowding} />;
}
