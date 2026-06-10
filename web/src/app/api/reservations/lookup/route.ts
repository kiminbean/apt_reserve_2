import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// @MX:NOTE: [AUTO] 예약 조회 API — 이름+전화번호로 본인 예약 확인

/**
 * GET /api/reservations/lookup?name=홍길동&phone=01012345678
 * 이름과 전화번호로 예약 내역 조회.
 * Why: 예약자가 본인의 예약 내역을 확인하거나 취소하기 위해 조회하는 진입점.
 *   개인정보 보호를 위해 이름+전화번호 조합으로만 조회 가능하다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.trim();
    const phone = searchParams.get("phone")?.trim();

    // 필수 파라미터 확인
    if (!name) {
      return NextResponse.json(
        { error: "이름을 입력해 주세요." },
        { status: 400 },
      );
    }
    if (!phone) {
      return NextResponse.json(
        { error: "연락처를 입력해 주세요." },
        { status: 400 },
      );
    }

    // 전화번호에서 비숫자 제거 후 조회
    const digitsOnly = phone.replace(/\D/g, "");
    if (!/^\d{10,11}$/.test(digitsOnly)) {
      return NextResponse.json(
        { error: "연락처는 숫자만 10~11자리로 입력해 주세요." },
        { status: 400 },
      );
    }

    // 예약 내역 조회 (슬롯 정보 포함)
    const reservations = await prisma.reservation.findMany({
      where: { name, phone: digitsOnly },
      include: { slot: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reservations: reservations.map((r) => ({
        id: r.id,
        name: r.name,
        buildingNo: r.dong,
        unitNo: r.ho,
        phone: r.phone,
        date: r.slot.date,
        startTime: r.slot.label,
        endTime: null,
        headCount: r.headcount,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/reservations/lookup] 오류:", error);
    return NextResponse.json(
      { error: "예약 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
