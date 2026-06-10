import { NextResponse } from "next/server";
import { getActiveEvent, attachRemaining } from "@/lib/reservations";

// @MX:ANCHOR: [AUTO] 공개 예약 - 활성 행사 조회 API
// @MX:REASON: 프론트엔드 예약 폼이 최초 진입 시 반드시 호출하는 진입점 (fan_in >= 3 예상)

/**
 * GET /api/reservations/event
 * 활성 행사를 모든 시간대와 잔여석 정보와 함께 반환.
 * Why: 예약 폼 진입 시 유일하게 호출되어 행사 정보 + 선택 가능한 슬롯을 한 번에 내려준다.
 */
export async function GET() {
  try {
    const event = await getActiveEvent();

    if (!event) {
      return NextResponse.json(
        { error: "현재 진행 중인 행사가 없습니다." },
        { status: 404 },
      );
    }

    // 잔여석 계산: groupBy 1회로 N+1 방지
    const slotsWithRemaining = await attachRemaining(event.slots);

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      slots: slotsWithRemaining.map((slot) => ({
        id: slot.id,
        date: slot.date,
        label: slot.label,
        capacity: slot.capacity,
        remaining: slot.remaining,
        sortOrder: slot.sortOrder,
      })),
    });
  } catch (error) {
    console.error("[GET /api/reservations/event] 오류:", error);
    return NextResponse.json(
      { error: "행사 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
