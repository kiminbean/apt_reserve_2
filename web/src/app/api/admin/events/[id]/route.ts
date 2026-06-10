import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

/**
 * PATCH /api/admin/events/[id]
 * 행사 정보 수정 (제목, 기간, 활성 상태).
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
      return NextResponse.json({ error: "유효하지 않은 행사 ID입니다." }, { status: 400 });
    }

    const body = await request.json();
    const { title, startDate, endDate, active } = body as {
      title?: string;
      startDate?: string;
      endDate?: string;
      active?: boolean;
    };

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "해당 행사를 찾을 수 없습니다." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (active !== undefined) data.active = active;

    const updated = await prisma.event.update({ where: { id }, data });
    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/events/[id]] 오류:", error);
    return NextResponse.json(
      { error: "행사 수정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/events/[id]
 * 행사를 비활성화(soft delete). 예약이 있는 경우 활성만 해제.
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
      return NextResponse.json({ error: "유효하지 않은 행사 ID입니다." }, { status: 400 });
    }

    const existing = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { slots: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "해당 행사를 찾을 수 없습니다." }, { status: 404 });
    }

    // Why: 예약 데이터가 있는 행사는 완전 삭제하지 않고 비활성화만.
    // 슬롯이 없는 빈 행사는 완전 삭제 가능.
    const hasSlots = existing._count.slots > 0;

    if (hasSlots) {
      const updated = await prisma.event.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({ event: updated, softDeleted: true });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/admin/events/[id]] 오류:", error);
    return NextResponse.json(
      { error: "행사 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
