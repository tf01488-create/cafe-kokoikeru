"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CrowdingBadge from "@/components/CrowdingBadge";

type Store = {
  id: number;
  name: string;
  address: string;
};

type StatusOption = {
  value: string;
  label: string;
  description: string;
  activeClass: string;
  inactiveClass: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "空きあり",
    label: "空きあり",
    description: "席がすぐに使えます",
    activeClass:
      "border-green-500 bg-green-50 ring-2 ring-green-400 text-green-900",
    inactiveClass:
      "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 text-gray-700",
  },
  {
    value: "混雑しているが空きあり",
    label: "混雑しているが空きあり",
    description: "席はありますが混んでいます",
    activeClass:
      "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-400 text-yellow-900",
    inactiveClass:
      "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50 text-gray-700",
  },
  {
    value: "満席",
    label: "満席",
    description: "現在空席はありません",
    activeClass: "border-red-500 bg-red-50 ring-2 ring-red-400 text-red-900",
    inactiveClass:
      "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50 text-gray-700",
  },
];

function PostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStoreId = searchParams.get("storeId");

  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    initialStoreId ?? ""
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stores")
      .then((res) => {
        if (!res.ok) throw new Error("店舗情報の取得に失敗しました");
        return res.json();
      })
      .then((data: { stores: Store[] }) => {
        setStores(data.stores);
        setStoresLoading(false);
      })
      .catch(() => {
        setStoresLoading(false);
      });
  }, []);

  const canSubmit = selectedStoreId !== "" && selectedStatus !== "" && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/crowding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: Number(selectedStoreId),
          status: selectedStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const serverMsg = (data as { error?: string }).error;
        if (res.status === 429) {
          throw new Error(serverMsg ?? "同じ店舗への連続投稿は5分間隔でお願いします");
        }
        throw new Error(serverMsg ?? "報告の送信に失敗しました");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "報告の送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">☕</div>
        <h2 className="text-2xl font-bold text-amber-900 mb-2">
          報告ありがとうございます！
        </h2>
        <p className="text-amber-700 mb-8">
          あなたの情報が他のお客様の参考になります。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-amber-800 text-white rounded-full font-semibold hover:bg-amber-900 transition"
          >
            混雑情報を見る
          </a>
          <button
            onClick={() => {
              setSuccess(false);
              setSelectedStatus("");
            }}
            className="px-6 py-3 border border-amber-700 text-amber-800 rounded-full font-semibold hover:bg-amber-50 transition"
          >
            続けて報告する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-amber-900">混雑状況を報告する</h1>
        <p className="text-amber-700 text-sm mt-1">
          現在のカフェの混雑状況を教えてください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Store selector */}
        <div>
          <label
            htmlFor="store-select"
            className="block text-sm font-semibold text-amber-800 mb-2"
          >
            1. 店舗を選んでください
          </label>
          {storesLoading ? (
            <div className="w-full h-12 bg-amber-100 rounded-xl animate-pulse" />
          ) : (
            <select
              id="store-select"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-amber-300 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base"
            >
              <option value="">— 店舗を選択 —</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status selector */}
        <div>
          <p className="block text-sm font-semibold text-amber-800 mb-3">
            2. 現在の混雑状況を選んでください
          </p>
          <div className="space-y-3">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 text-left ${
                    isSelected ? option.activeClass : option.inactiveClass
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-0.5">
                      <CrowdingBadge status={option.value} />
                    </div>
                    <p className="text-sm mt-1 opacity-75">{option.description}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected
                        ? "border-current bg-current"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white block" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
            canSubmit
              ? "bg-amber-800 text-white hover:bg-amber-900 active:scale-95 shadow-md"
              : "bg-amber-200 text-amber-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "送信中..." : "報告する"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-amber-700 text-sm hover:underline"
          >
            ← トップに戻る
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto text-center py-20 text-amber-600">
          <p className="text-lg animate-pulse">読み込み中...</p>
        </div>
      }
    >
      <PostForm />
    </Suspense>
  );
}
