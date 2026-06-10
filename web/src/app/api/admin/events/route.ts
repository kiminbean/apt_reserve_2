import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

// @MX:ANCHOR: [AUTO] 관리자 행사 CRUD API
// @MX:REASON: 행사 생성·조회·수정·삭제의 관리자 전용 진입점

/**
 * GET /api/admin/events
 * 전체 행사 목록을 슬롯 통계와 함께 조회.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        slots: {
          orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
          include: {
            _count: { select: { reservations: { where: { status: "confirmed" } } } },
          },
        },
      },
    });

    return NextResponse.json({
      events: events.map((event) => {
        const totalCapacity = event.slots.reduce((sum, s) => sum + s.capacity, 0);
        const totalReserved = event.slots.reduce((sum, s) => sum + s._count.reservations, 0);
        return {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          active: event.active,
          createdAt: event.createdAt,
          stats: {
            totalSlots: event.slots.length,
            totalCapacity,
            totalReserved,
            totalRemaining: Math.max(0, totalCapacity - totalReserved),
          },
          slots: event.slots.map((s) => ({
            id: s.id,
            date: s.date,
            label: s.label,
            capacity: s.capacity,
            sortOrder: s.sortOrder,
            reserved: s._count.reservations,
            remaining: Math.max(0, s.capacity - s._count.reservations),
          })),
        };
      }),
    });
  } catch (error) {
    console.error("[GET /api/admin/events] 오류:", error);
    return NextResponse.json(
      { error: "행사 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/events
 * 새 행사를 생성. startDate, endDate, title, active 필수.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { title, startDate, endDate, active } = body as {
      title?: string;
      startDate?: string;
      endDate?: string;
      active?: boolean;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "행사명을 입력해 주세요." }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "행사 기간을 설정해 주세요." }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active ?? true,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/events] 오류:", error);
    return NextResponse.json(
      { error: "행사 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
