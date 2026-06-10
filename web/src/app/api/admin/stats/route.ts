import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";

/**
 * GET /api/admin/stats
 * 관리자 대시보드 통계 정보.
 * 확정/취소 예약 수, 행사 수, 오늘 예약 수, 전체 참여 인원.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [
      confirmedCount,
      canceledCount,
      eventCount,
      activeEventCount,
      totalHeadcount,
      todayReservations,
    ] = await Promise.all([
      prisma.reservation.count({ where: { status: "confirmed" } }),
      prisma.reservation.count({ where: { status: "canceled" } }),
      prisma.event.count(),
      prisma.event.count({ where: { active: true } }),
      prisma.reservation.aggregate({
        where: { status: "confirmed" },
        _sum: { headcount: true },
      }),
      prisma.reservation.count({
        where: {
          status: "confirmed",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return NextResponse.json({
      confirmedCount,
      canceledCount,
      eventCount,
      activeEventCount,
      totalHeadcount: totalHeadcount._sum.headcount ?? 0,
      todayReservations,
    });
  } catch (error) {
    console.error("[GET /api/admin/stats] 오류:", error);
    return NextResponse.json(
      { error: "통계를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
