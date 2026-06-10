import { prisma } from "@/lib/db";
import type { Event, TimeSlot } from "@prisma/client";

// Why: Phase 3(공개 예약 접수)가 소비할 데이터 계층.
// 잔여석은 컬럼이 아닌 계산값(capacity - SUM headcount of confirmed)이 단일 진실.
// 이 파일은 조회 전용이며 생성/취소 변경 로직은 Phase 3/4 책임이므로 포함하지 않는다.

/** 슬롯에 잔여석(remaining)을 덧붙인 조회용 타입 */
export type SlotWithRemaining = TimeSlot & { remaining: number };

/** 활성 행사 + 정렬된 슬롯 */
export type ActiveEventWithSlots = Event & { slots: TimeSlot[] };

// Why: "확정" 예약만 정원을 점유한다. canceled 는 잔여석에 반영하지 않는다.
const CONFIRMED = "confirmed";

/**
 * 활성 행사 1건을 슬롯과 함께 조회.
 * Why: 시스템상 활성 행사는 단일 운영을 전제로 한다. 복수 활성 시 가장 최근 생성건을
 * 우선해 결정적으로 1건만 반환한다(날짜→정렬순으로 슬롯 정렬).
 * @returns 활성 행사가 없으면 null
 */
export async function getActiveEvent(): Promise<ActiveEventWithSlots | null> {
  return prisma.event.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: {
      slots: {
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      },
    },
  });
}

/**
 * 특정 행사+날짜의 슬롯 목록(정렬순).
 * Why: 날짜는 자정 기준 저장이므로 호출측이 자정 Date 를 넘겨야 정확히 매칭된다.
 */
export async function getSlotsByDate(
  eventId: number,
  date: Date,
): Promise<TimeSlot[]> {
  return prisma.timeSlot.findMany({
    where: { eventId, date },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * 단일 슬롯 잔여석 계산 = capacity - SUM(confirmed 예약 headcount).
 * Why: aggregate 1회로 N+1 없이 합계 계산. 음수 방지(초과 예약 시 0으로 클램프).
 * @returns 슬롯이 없으면 null
 */
export async function getRemainingForSlot(slotId: number): Promise<number | null> {
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId },
    select: { capacity: true },
  });
  if (!slot) return null;

  const agg = await prisma.reservation.aggregate({
    where: { slotId, status: CONFIRMED },
    _sum: { headcount: true },
  });
  const used = agg._sum.headcount ?? 0;
  return Math.max(0, slot.capacity - used);
}

/**
 * 여러 슬롯의 잔여석을 한 번에 계산해 슬롯에 부착.
 * Why: groupBy 1회로 슬롯 N개의 사용량을 모아 N+1 쿼리를 피한다.
 * 목록/가용성 UI가 슬롯 배열을 받아 잔여석까지 함께 그릴 때 사용.
 */
export async function attachRemaining(
  slots: TimeSlot[],
): Promise<SlotWithRemaining[]> {
  if (slots.length === 0) return [];

  const slotIds = slots.map((s) => s.id);
  const grouped = await prisma.reservation.groupBy({
    by: ["slotId"],
    where: { slotId: { in: slotIds }, status: CONFIRMED },
    _sum: { headcount: true },
  });

  // slotId → 사용 headcount 합계 맵
  const usedBySlot = new Map<number, number>();
  for (const g of grouped) {
    usedBySlot.set(g.slotId, g._sum.headcount ?? 0);
  }

  return slots.map((s) => ({
    ...s,
    remaining: Math.max(0, s.capacity - (usedBySlot.get(s.id) ?? 0)),
  }));
}
