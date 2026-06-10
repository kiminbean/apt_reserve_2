"use client";

import { useEffect, useState, useCallback } from "react";

interface SlotInfo {
  id: number;
  date: string;
  label: string;
  capacity: number;
  sortOrder: number;
  reserved: number;
  remaining: number;
}

interface EventInfo {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  stats: {
    totalSlots: number;
    totalCapacity: number;
    totalReserved: number;
    totalRemaining: number;
  };
  slots: SlotInfo[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 새 행사 폼 상태
  const [showCreate, setShowCreate] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [creating, setCreating] = useState(false);

  // 슬롯 폼 상태
  const [slotEventId, setSlotEventId] = useState<number | null>(null);
  const [slotDate, setSlotDate] = useState("");
  const [slotLabels, setSlotLabels] = useState("10:00 ~ 11:00\n11:00 ~ 12:00\n13:00 ~ 14:00\n14:00 ~ 15:00");
  const [slotCapacity, setSlotCapacity] = useState("5");
  const [creatingSlots, setCreatingSlots] = useState(false);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      })
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- 초기 데이터 로딩 (Server Components 전환 예정)
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // 행사 생성
  async function createEvent() {
    if (!formTitle.trim() || !formStart || !formEnd) {
      alert("모든 필드를 입력해 주세요.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          startDate: formStart,
          endDate: formEnd,
          active: true,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormTitle(""); setFormStart(""); setFormEnd("");
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || "행사 생성에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  }

  // 행사 활성/비활성 토글
  async function toggleActive(id: number, current: boolean) {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current }),
      });
      if (res.ok) fetchEvents();
    } catch { /* ignore */ }
  }

  // 행사 삭제 (비활성화)
  async function deleteEvent(id: number) {
    if (!confirm("이 행사를 비활성화하시겠습니까? 예약 데이터는 유지됩니다.")) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) fetchEvents();
    } catch { /* ignore */ }
  }

  // 타임슬롯 일괄 생성
  async function createSlots() {
    if (!slotEventId || !slotDate || !slotLabels.trim()) {
      alert("날짜와 시간대를 입력해 주세요.");
      return;
    }
    setCreatingSlots(true);
    try {
      const labels = slotLabels.trim().split("\n").filter((l) => l.trim());
      const slots = labels.map((label, i) => ({
        date: slotDate,
        label: label.trim(),
        capacity: Number(slotCapacity) || 5,
        sortOrder: i,
      }));

      const res = await fetch(`/api/admin/events/${slotEventId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (res.ok) {
        setSlotDate("");
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || "시간대 생성에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setCreatingSlots(false);
    }
  }

  // 개별 슬롯 삭제
  async function deleteSlot(slotId: number) {
    if (!confirm("이 시간대를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/slots/${slotId}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch { /* ignore */ }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatKoreanDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">행사 관리</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[#fd391f] hover:bg-[#d22c16] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showCreate ? "취소" : "+ 새 행사"}
        </button>
      </div>

      {/* 새 행사 생성 폼 */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold">새 행사 등록</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">행사명</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="예: OOO 아파트 방문 예약"
                className="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작일</label>
              <input
                type="date"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">종료일</label>
              <input
                type="date"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
              />
            </div>
          </div>
          <button
            onClick={createEvent}
            disabled={creating}
            className="px-6 py-2 bg-[#fd391f] hover:bg-[#d22c16] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {creating ? "생성 중..." : "행사 생성"}
          </button>
        </div>
      )}

      {/* 행사 목록 */}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-500">불러오는 중...</div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
          등록된 행사가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* 행사 헤더 */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{event.title}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        event.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {event.active ? "활성" : "비활성"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatKoreanDate(event.startDate)} ~ {formatKoreanDate(event.endDate)}
                    </p>
                  </div>
                  <div className="flex gap-4 text-center text-sm">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{event.stats.totalReserved}</p>
                      <p className="text-xs text-gray-500">예약</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{event.stats.totalRemaining}</p>
                      <p className="text-xs text-gray-500">잔여</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{event.stats.totalSlots}</p>
                      <p className="text-xs text-gray-500">슬롯</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 확장: 슬롯 목록 + 관리 */}
              {expandedId === event.id && (
                <div className="border-t border-gray-200 p-5 space-y-4">
                  {/* 관리 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(event.id, event.active)}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        event.active
                          ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {event.active ? "비활성화" : "활성화"}
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setSlotEventId(slotEventId === event.id ? null : event.id)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium"
                    >
                      + 시간대 추가
                    </button>
                  </div>

                  {/* 슬롯 추가 폼 */}
                  {slotEventId === event.id && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-semibold">시간대 일괄 추가</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">날짜</label>
                          <input
                            type="date"
                            value={slotDate}
                            onChange={(e) => setSlotDate(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">슬롯당 정원</label>
                          <input
                            type="number"
                            value={slotCapacity}
                            onChange={(e) => setSlotCapacity(e.target.value)}
                            min="1"
                            className="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">시간대 (줄바꿈 구분)</label>
                          <textarea
                            value={slotLabels}
                            onChange={(e) => setSlotLabels(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
                          />
                        </div>
                      </div>
                      <button
                        onClick={createSlots}
                        disabled={creatingSlots}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        {creatingSlots ? "생성 중..." : "시간대 생성"}
                      </button>
                    </div>
                  )}

                  {/* 슬롯 목록 */}
                  {event.slots.length === 0 ? (
                    <p className="text-sm text-gray-400">등록된 시간대가 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">날짜</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">시간대</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">정원</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">예약</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">잔여</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">관리</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {event.slots.map((slot) => (
                            <tr key={slot.id}>
                              <td className="px-3 py-2 text-gray-600">{formatDate(slot.date)}</td>
                              <td className="px-3 py-2">{slot.label}</td>
                              <td className="px-3 py-2 text-center">{slot.capacity}</td>
                              <td className="px-3 py-2 text-center text-blue-600 font-medium">{slot.reserved}</td>
                              <td className={`px-3 py-2 text-center font-medium ${slot.remaining === 0 ? "text-red-500" : "text-green-600"}`}>
                                {slot.remaining}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {slot.reserved === 0 && (
                                  <button
                                    onClick={() => deleteSlot(slot.id)}
                                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                                  >
                                    삭제
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
