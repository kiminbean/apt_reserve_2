import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";
import { sendCancellationNotification } from "@/lib/email";

// @MX:ANCHOR: [AUTO] 관리자 예약 상태 변경 API
// @MX:REASON: 예약 확정/취소 토글의 유일한 관리자 진입점

/**
 * PATCH /api/admin/reservations/[id]/status
 * 예약 상태를 confirmed ↔ canceled 로 토글.
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
      return NextResponse.json({ error: "유효하지 않은 예약 ID입니다." }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["confirmed", "canceled"].includes(status)) {
      return NextResponse.json(
        { error: "status는 confirmed 또는 canceled여야 합니다." },
        { status: 400 },
      );
    }

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "해당 예약을 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        slot: {
          select: { id: true, date: true, label: true, event: { select: { title: true } } },
        },
      },
    });

    // Why: 관리자 취소 시 알림 발송. 실패해도 상태 변경 응답에는 영향 없음.
    if (status === "canceled") {
      sendCancellationNotification({
        reservationId: updated.id,
        name: updated.name,
        dong: updated.dong,
        ho: updated.ho,
      }).catch(() => { /* 이메일 실패 무시 */ });
    }

    return NextResponse.json({
      reservation: {
        id: updated.id,
        name: updated.name,
        dong: updated.dong,
        ho: updated.ho,
        phone: updated.phone,
        headcount: updated.headcount,
        status: updated.status,
        createdAt: updated.createdAt,
        slot: updated.slot,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/reservations/[id]/status] 오류:", error);
    return NextResponse.json(
      { error: "예약 상태 변경 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
