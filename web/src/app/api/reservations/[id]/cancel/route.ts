import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// @MX:NOTE: [AUTO] 예약 취소 API — 전화번호 확인 후 소프트 삭제(status → canceled)

/**
 * POST /api/reservations/[id]/cancel
 * 예약 취소 — 상태를 confirmed에서 canceled로 변경 (소프트 삭제).
 * Why: 예약 데이터는 보존하되 취소 처리하기 위해 실제 레코드 삭제가 아닌
 *   status 필드 변경으로 처리한다. 취소된 예약은 잔여석 계산에서 제외된다.
 *   본인 확인을 위해 예약 시 사용한 전화번호를 요청 본문에서 받아 검증한다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    // 유효하지 않은 ID
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "유효하지 않은 예약 번호입니다." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const phone = (body?.phone as string | undefined)?.trim();

    if (!phone) {
      return NextResponse.json(
        { error: "연락처를 입력해 주세요." },
        { status: 400 },
      );
    }

    // 전화번호에서 비숫자 제거
    const digitsOnly = phone.replace(/\D/g, "");

    // 예약 조회
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "해당 예약을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 전화번호 일치 확인 (본인 인증)
    if (reservation.phone !== digitsOnly) {
      return NextResponse.json(
        { error: "예약 시 입력한 연락처와 일치하지 않습니다." },
        { status: 403 },
      );
    }

    // 이미 취소된 예약
    if (reservation.status === "canceled") {
      return NextResponse.json(
        { error: "이미 취소된 예약입니다." },
        { status: 409 },
      );
    }

    // 상태 변경 (소프트 삭제)
    await prisma.reservation.update({
      where: { id },
      data: { status: "canceled" },
    });

    return NextResponse.json({
      success: true,
      message: "예약이 취소되었습니다.",
    });
  } catch (error) {
    console.error("[POST /api/reservations/[id]/cancel] 오류:", error);
    return NextResponse.json(
      { error: "예약 취소 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
