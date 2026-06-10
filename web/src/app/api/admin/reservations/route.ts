import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-api";
import { Prisma } from "@prisma/client";

// @MX:ANCHOR: [AUTO] 관리자 예약 목록 조회 API
// @MX:REASON: 관리자 대시보드·예약 관리 UI의 핵심 데이터 소스 (fan_in >= 3 예상)

/**
 * GET /api/admin/reservations
 * 예약 목록을 필터/페이지네이션과 함께 조회.
 * 쿼리 파라미터: eventId, status, search, page, limit
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    // 동적 where 조건 구성
    const where: Prisma.ReservationWhereInput = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      // Why: 이름, 동, 호수, 전화번호로 부분 검색. SQLite는 contains가 기본 대소문자 구분 없음
      where.OR = [
        { name: { contains: search } },
        { dong: { contains: search } },
        { ho: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (eventId) {
      where.slot = { eventId: Number(eventId) };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          slot: {
            select: {
              id: true,
              date: true,
              label: true,
              capacity: true,
              event: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return NextResponse.json({
      reservations: reservations.map((r) => ({
        id: r.id,
        name: r.name,
        dong: r.dong,
        ho: r.ho,
        phone: r.phone,
        headcount: r.headcount,
        status: r.status,
        createdAt: r.createdAt,
        slot: {
          id: r.slot.id,
          date: r.slot.date,
          label: r.slot.label,
          capacity: r.slot.capacity,
          event: r.slot.event,
        },
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/reservations] 오류:", error);
    return NextResponse.json(
      { error: "예약 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
