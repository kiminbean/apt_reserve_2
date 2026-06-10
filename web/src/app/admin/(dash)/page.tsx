"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  confirmedCount: number;
  canceledCount: number;
  eventCount: number;
  activeEventCount: number;
  totalHeadcount: number;
  todayReservations: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">대시보드</h1>
        <p className="text-sm text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  const cards = [
    { label: "확정 예약", value: stats?.confirmedCount ?? 0, unit: "건", color: "text-blue-600" },
    { label: "취소 예약", value: stats?.canceledCount ?? 0, unit: "건", color: "text-gray-500" },
    { label: "전체 참여 인원", value: stats?.totalHeadcount ?? 0, unit: "명", color: "text-green-600" },
    { label: "오늘 접수", value: stats?.todayReservations ?? 0, unit: "건", color: "text-[#fd391f]" },
    { label: "활성 행사", value: stats?.activeEventCount ?? 0, unit: "개", color: "text-purple-600" },
    { label: "전체 행사", value: stats?.eventCount ?? 0, unit: "개", color: "text-gray-700" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">대시보드</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>
              {card.value.toLocaleString()}<span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/reservations"
          className="px-6 py-3 bg-[#fd391f] hover:bg-[#d22c16] text-white font-semibold rounded-lg transition-colors"
        >
          예약 관리
        </Link>
        <Link
          href="/admin/events"
          className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 font-semibold rounded-lg transition-colors"
        >
          행사 관리
        </Link>
      </div>
    </div>
  );
}
