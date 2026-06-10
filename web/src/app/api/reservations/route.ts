import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAdminNotification } from "@/lib/email";

// @MX:ANCHOR: [AUTO] 공개 예약 - 예약 접수 API
// @MX:REASON: 예약 생성의 유일한 진입점. 동시성 제어 로직이 포함된 핵심 API (fan_in >= 3 예상)

/** 한국 휴대전화 번호 패턴: 숫자만 10~11자리 */
const PHONE_REGEX = /^\d{10,11}$/;

/** 동/호수 패턴: 숫자만 정확히 4자리 */
const DONG_HO_REGEX = /^\d{4}$/;

/** Prisma 상호배제 트랜잭션 최대 재시도 횟수 */
const MAX_TX_RETRIES = 3;

/**
 * 입력값 검증 공통 함수.
 * Why: 서버 사이드 검증은 보안의 최후 방어선. 클라이언트 검증은 우회 가능하므로
 * 서버에서 반드시 동/호수 4자리, 전화번호 형식, 필수 필드를 재확인한다.
 */
function validateReservationInput(body: unknown): {
  ok: true; data: CreateReservationInput;
} | {
  ok: false; error: string; status: number;
} {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "요청 본문이 누락되었습니다.", status: 400 };
  }

  const {
    name, buildingNo, unitNo, phone, timeSlotId, headCount,
  } = body as Record<string, unknown>;

  // 필수 필드 확인
  if (!name || typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "계약자 이름을 입력해 주세요.", status: 400 };
  }
  if (!buildingNo || typeof buildingNo !== "string") {
    return { ok: false, error: "동을 입력해 주세요.", status: 400 };
  }
  if (!unitNo || typeof unitNo !== "string") {
    return { ok: false, error: "호수를 입력해 주세요.", status: 400 };
  }
  if (!phone || typeof phone !== "string") {
    return { ok: false, error: "연락처를 입력해 주세요.", status: 400 };
  }
  if (timeSlotId === undefined || timeSlotId === null || typeof timeSlotId !== "number") {
    return { ok: false, error: "시간대를 선택해 주세요.", status: 400 };
  }
  if (headCount === undefined || headCount === null || typeof headCount !== "number" || headCount < 1) {
    return { ok: false, error: "참여 인원은 1명 이상이어야 합니다.", status: 400 };
  }

  // 동/호수: 정확히 4자리 숫자
  if (!DONG_HO_REGEX.test(buildingNo)) {
    return { ok: false, error: "동은 4자리 숫자로 입력해 주세요. (예: 0101)", status: 400 };
  }
  if (!DONG_HO_REGEX.test(unitNo)) {
    return { ok: false, error: "호수는 4자리 숫자로 입력해 주세요. (예: 0101)", status: 400 };
  }

  // 전화번호: 하이픈/공백 제거 후 숫자만 10~11자리
  const digitsOnly = phone.replace(/\D/g, "");
  if (!PHONE_REGEX.test(digitsOnly)) {
    return { ok: false, error: "연락처는 숫자만 10~11자리로 입력해 주세요.", status: 400 };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      dong: buildingNo,
      ho: unitNo,
      phone: digitsOnly,
      timeSlotId,
      headCount,
    },
  };
}

interface CreateReservationInput {
  name: string;
  dong: string;
  ho: string;
  phone: string;
  timeSlotId: number;
  headCount: number;
}

/**
 * POST /api/reservations
 * 예약 접수 — 선착순 동시성 제어 포함.
 * Why: Prisma 인터랙티브 트랜잭션 내에서 잔여석을 확인하고 create까지 원자적으로 수행하여
 * 동시 요청 시에도 초과 예약을 방지한다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateReservationInput(body);

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const { name, dong, ho, phone, timeSlotId, headCount } = validation.data;

    // @MX:WARN: [AUTO] 동시성 제어 구간 — Prisma 인터랙티브 트랜잭션 + 재시도
    // @MX:REASON: 잔여석 확인과 예약 생성 사이에 경쟁 조건이 발생할 수 있음.
    //   Prisma의 serializable 격리 수준에서 충돌 시 P2034 에러가 발생하므로
    //   지수 백오프로 최대 MAX_TX_RETRIES회 재시도한다.
    let reservation;
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_TX_RETRIES; attempt++) {
      try {
        reservation = await prisma.$transaction(
          async (tx) => {
            // 1. 슬롯 조회 (행사 활성 여부도 함께 확인)
            const slot = await tx.timeSlot.findUnique({
              where: { id: timeSlotId },
              include: { event: true },
            });

            if (!slot || !slot.event) {
              throw new TransactionError("해당 시간대를 찾을 수 없습니다.", 404);
            }

            // 행사가 활성 상태인지 확인
            if (!slot.event.active) {
              throw new TransactionError("현재 예약 가능한 행사가 아닙니다.", 404);
            }

            // 2. 행사 기간 내 날짜인지 확인
            const slotDate = new Date(slot.date);
            const startDate = new Date(slot.event.startDate);
            const endDate = new Date(slot.event.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            if (slotDate < startDate || slotDate > endDate) {
              throw new TransactionError("행사 기간이 아닌 날짜입니다.", 400);
            }

            // 3. 세대당 1회 예약 확인 (동+호수 또는 이름+전화번호)
            const existingByUnit = await tx.reservation.findFirst({
              where: {
                dong,
                ho,
                status: "confirmed",
                slot: { eventId: slot.eventId },
              },
            });
            if (existingByUnit) {
              throw new TransactionError(
                "해당 세대(동/호수)에서 이미 예약이 완료되었습니다.",
                409,
              );
            }

            const existingByName = await tx.reservation.findFirst({
              where: {
                name,
                phone,
                status: "confirmed",
                slot: { eventId: slot.eventId },
              },
            });
            if (existingByName) {
              throw new TransactionError(
                "해당 이름과 연락처로 이미 예약이 완료되었습니다.",
                409,
              );
            }

            // 4. 잔여석 확인
            const usedAgg = await tx.reservation.aggregate({
              where: { slotId: timeSlotId, status: "confirmed" },
              _sum: { headcount: true },
            });
            const used = usedAgg._sum.headcount ?? 0;
            const remaining = slot.capacity - used;

            if (remaining < headCount) {
              throw new TransactionError(
                "해당 시간대의 잔여 인원이 부족합니다.",
                409,
              );
            }

            // 5. 예약 생성
            return tx.reservation.create({
              data: {
                slotId: timeSlotId,
                name,
                dong,
                ho,
                phone,
                headcount: headCount,
                status: "confirmed",
              },
            });
          },
          { maxWait: 5000, timeout: 10000 },
        );
        // 성공 — 루프 탈출
        break;
      } catch (error) {
        // 비즈니스 로직 오류 — 재시도 없이 즉시 반환
        if (error instanceof TransactionError) {
          return NextResponse.json(
            { error: error.message },
            { status: error.statusCode },
          );
        }
        // 트랜잭션 충돌(P2034 등) — 지수 백오프 후 재시도
        lastError = error;
        if (attempt < MAX_TX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
        }
      }
    }

    // 모든 재시도 실패
    if (!reservation) {
      throw lastError;
    }

    // 응답에 슬롯 정보 포함
    const slot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    });

    // Why: 이메일 발송은 비동기 백그라운드 처리. 실패해도 예약 응답에 영향 없음.
    sendAdminNotification({
      reservationId: reservation.id,
      name,
      dong,
      ho,
      phone,
      headcount: headCount,
      slotId: timeSlotId,
    }).catch(() => { /* 이메일 실패는 무시 */ });

    return NextResponse.json(
      {
        success: true,
        reservation: {
          id: reservation.id,
          name: reservation.name,
          buildingNo: reservation.dong,
          unitNo: reservation.ho,
          phone: reservation.phone,
          date: slot?.date ?? null,
          timeSlot: slot?.label ?? null,
          headCount: reservation.headcount,
          createdAt: reservation.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/reservations] 오류:", error);
    return NextResponse.json(
      { error: "예약 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * 트랜잭션 내 비즈니스 로직 오류를 구분하기 위한 커스텀 에러.
 * Why: Prisma 트랜잭션 내에서 throw된 일반 Error와 비즈니스 검증 실패를
 * 구분하여 적절한 HTTP 상태 코드를 반환하기 위함.
 */
class TransactionError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "TransactionError";
    this.statusCode = statusCode;
  }
}
