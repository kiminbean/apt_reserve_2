import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

/**
 * PATCH /api/admin/slots/[id]
 * 개별 타임슬롯 수정 (정원, 정렬순서).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "유효하지 않은 슬롯 ID입니다." }, { status: 400 });
    }

    const body = await request.json();
    const { capacity, sortOrder, label } = body as {
      capacity?: number;
      sortOrder?: number;
      label?: string;
    };

    const existing = await prisma.timeSlot.findUnique({
      where: { id },
      include: { _count: { select: { reservations: { where: { status: "confirmed" } } } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "해당 시간대를 찾을 수 없습니다." }, { status: 404 });
    }

    // Why: 정원을 현재 예약 수보다 줄이는 것은 허용하되 경고
    const data: Record<string, unknown> = {};
    if (capacity !== undefined) data.capacity = Math.max(1, capacity);
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (label !== undefined) data.label = label;

    const updated = await prisma.timeSlot.update({ where: { id }, data });
    return NextResponse.json({ slot: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/slots/[id]] 오류:", error);
    return NextResponse.json(
      { error: "시간대 수정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/slots/[id]
 * 개별 타임슬롯 삭제. 예약이 있으면 삭제 불가.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "유효하지 않은 슬롯 ID입니다." }, { status: 400 });
    }

    const existing = await prisma.timeSlot.findUnique({
      where: { id },
      include: { _count: { select: { reservations: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "해당 시간대를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existing._count.reservations > 0) {
      return NextResponse.json(
        { error: "예약이 있는 시간대는 삭제할 수 없습니다. 예약을 먼저 취소해 주세요." },
        { status: 409 },
      );
    }

    await prisma.timeSlot.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/admin/slots/[id]] 오류:", error);
    return NextResponse.json(
      { error: "시간대 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
