"use client";

import { useEffect, useState, useCallback } from "react";

interface SlotInfo {
  id: number;
  date: string;
  label: string;
  capacity: number;
  event: { id: number; title: string };
}

interface Reservation {
  id: number;
  name: string;
  dong: string;
  ho: string;
  phone: string;
  headcount: number;
  status: string;
  createdAt: string;
  slot: SlotInfo;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EventOption {
  id: number;
  title: string;
  active: boolean;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // 필터 상태
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("");
  const [page, setPage] = useState(1);

  // 행사 목록 조회
  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.events) {
          setEvents(data.events.map((e: EventOption & { active: boolean }) => ({ id: e.id, title: e.title, active: e.active })));
        }
      });
  }, []);

  // 예약 목록 조회
  const fetchReservations = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      status: statusFilter,
    });
    if (search.trim()) params.set("search", search.trim());
    if (eventFilter) params.set("eventId", eventFilter);

    fetch(`/api/admin/reservations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.reservations) {
          setReservations(data.reservations);
          setPagination(data.pagination);
        }
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, eventFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 초기 데이터 로딩 (Server Components 전환 예정)
    fetchReservations();
  }, [fetchReservations]);

  // 예약 상태 토글
  async function toggleStatus(id: number, currentStatus: string) {
    setUpdating(id);
    const newStatus = currentStatus === "confirmed" ? "canceled" : "confirmed";
    try {
      const res = await fetch(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchReservations();
      } else {
        const data = await res.json();
        alert(data.error || "상태 변경에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setUpdating(null);
    }
  }

  // 날짜 포맷
  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatPhone(phone: string) {
    if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    return phone;
  }

  // 검색 디바운스
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">예약 관리</h1>

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">검색</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              placeholder="이름, 동/호수, 연락처"
              className="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full h-10 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
            >
              <option value="all">전체</option>
              <option value="confirmed">확정</option>
              <option value="canceled">취소</option>
            </select>
          </div>
          <div className="w-56">
            <label className="block text-xs text-gray-500 mb-1">행사</label>
            <select
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
              className="w-full h-10 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
            >
              <option value="">전체 행사</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}{e.active ? "" : " (비활성)"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 총 건수 */}
      <p className="text-sm text-gray-500">총 {pagination.total.toLocaleString()}건</p>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">불러오는 중...</div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">예약 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">동/호</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">연락처</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">인원</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">행사</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">방문일</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">시간대</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">상태</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => (
                  <tr key={r.id} className={r.status === "canceled" ? "bg-gray-50 opacity-70" : ""}>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.dong}동 {r.ho}호</td>
                    <td className="px-4 py-3 text-gray-600">{formatPhone(r.phone)}</td>
                    <td className="px-4 py-3 text-center">{r.headcount}명</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{r.slot.event.title}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.slot.date)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.slot.label}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {r.status === "confirmed" ? "확정" : "취소"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStatus(r.id, r.status)}
                        disabled={updating === r.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          r.status === "confirmed"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {updating === r.id ? "처리중..." : r.status === "confirmed" ? "취소" : "복구"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            이전
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            // 현재 페이지 기준으로 5개 버튼 표시
            const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
            const pageNum = start + i;
            if (pageNum > pagination.totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 border rounded text-sm ${
                  page === pageNum
                    ? "bg-[#fd391f] text-white border-[#fd391f]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
