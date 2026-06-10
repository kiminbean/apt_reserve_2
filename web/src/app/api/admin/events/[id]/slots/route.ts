import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

// @MX:ANCHOR: [AUTO] 관리자 타임슬롯 관리 API
// @MX:REASON: 행사 내 타임슬롯 일괄 생성/수정/삭제 진입점

interface SlotInput {
  id?: number;       // 기존 슬롯 수정 시 전달
  date: string;      // YYYY-MM-DD
  label: string;     // "10:00 ~ 11:00"
  capacity: number;
  sortOrder?: number;
}

/**
 * POST /api/admin/events/[id]/slots
 * 행사의 타임슬롯을 일괄 생성/수정.
 * body: { slots: SlotInput[] }
 * 기존 슬롯 중 목록에 없는 것은 삭제됨(full replace 전략).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id: idStr } = await params;
    const eventId = Number(idStr);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "유효하지 않은 행사 ID입니다." }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "해당 행사를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await request.json();
    const { slots } = body as { slots?: SlotInput[] };

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "최소 1개 이상의 시간대를 입력해 주세요." },
        { status: 400 },
      );
    }

    // Why: localMidnight 헬퍼 — "YYYY-MM-DD"를 로컬 자정 Date로 변환
    // UTC 파싱으로 인한 날짜 밀림 방지 (seed.ts와 동일 로직)
    function localMidnight(isoDate: string): Date {
      const [y, m, d] = isoDate.split("-").map((v) => Number(v));
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    // 트랜잭션으로 기존 슬롯 중 예약 없는 것 삭제 후 전체 재생성 (full replace)
    const result = await prisma.$transaction(async (tx) => {
      // 기존 슬롯 중 예약이 없는 것만 삭제
      const existingSlots = await tx.timeSlot.findMany({
        where: { eventId },
        include: { _count: { select: { reservations: true } } },
      });

      for (const slot of existingSlots) {
        if (slot._count.reservations === 0) {
          await tx.timeSlot.delete({ where: { id: slot.id } });
        }
      }

      // 새 슬롯 생성
      const created = [];
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const date = localMidnight(s.date);
        const sortOrder = s.sortOrder ?? i;

        const slot = await tx.timeSlot.create({
          data: {
            eventId,
            date,
            label: s.label,
            capacity: Math.max(1, s.capacity),
            sortOrder,
          },
        });
        created.push(slot);
      }

      return created;
    });

    return NextResponse.json({ slots: result, count: result.length }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/events/[id]/slots] 오류:", error);
    return NextResponse.json(
      { error: "시간대 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
