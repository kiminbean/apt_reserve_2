import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Why: 행사 식별 기준. 멱등성 가드(제목으로 findFirst)와 재시드 차단에 동일 값 사용
const EVENT_TITLE = "태화강 센트럴 아이파크 유상 옵션 계약";

// Why: 정적 클론 캘린더 스냅샷의 날짜별 "잔여석" 진실값.
// remaining = SUM(capacity) - SUM(headcount). 잔여는 컬럼이 아닌 계산값이므로,
// 정원 합계에서 예약(headcount)으로 채워 마감/잔여를 표현한다.
// fill = 채워야 할 인원수(= 정원합 - 목표 잔여석).
const DAY_SNAPSHOT: { date: string; remaining: number }[] = [
  { date: "2026-06-11", remaining: 19 },
  { date: "2026-06-12", remaining: 7 },
  { date: "2026-06-13", remaining: 0 }, // 마감
  { date: "2026-06-14", remaining: 0 }, // 마감
  { date: "2026-06-15", remaining: 2 },
];

// Why: 원본은 AJAX로 시간대를 불러와 정적 클론에 없다. 합리적 기본 시간대 4개를 정의.
// 각 슬롯 정원 5 × 4슬롯 = 하루 총정원 20. 잔여석은 이 총정원에서 예약으로 차감.
const SLOT_LABELS = ["10:00 ~ 11:00", "11:00 ~ 12:00", "13:00 ~ 14:00", "14:00 ~ 15:00"];
const SLOT_CAPACITY = 5;
const DAILY_CAPACITY = SLOT_LABELS.length * SLOT_CAPACITY; // 20

/**
 * 로컬 자정 기준 Date 생성.
 * Why: TimeSlot.date 는 "방문 날짜(자정 기준)"로 저장. "YYYY-MM-DD" 문자열을
 * new Date()에 직접 넣으면 UTC 자정으로 파싱되어 KST(+9) 환경에서 전날로 밀린다.
 * 연/월/일을 분해해 로컬 자정으로 생성하여 날짜 밀림을 방지한다.
 */
function localMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map((v) => Number(v));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

async function seedAdmin() {
  // 최초 관리자 계정 (로그인 후 비밀번호/계정 직접 변경 가능)
  const username = process.env.SEED_ADMIN_USER?.trim() || "admin";
  const password = process.env.SEED_ADMIN_PASS?.trim() || "admin1234";

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`이미 관리자 계정이 존재합니다: ${username}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: { username, passwordHash, isSuper: true },
  });

  console.log("관리자 계정 생성 완료");
  console.log(`  ID  : ${username}`);
  console.log(`  PW  : ${password}`);
  console.log("  ※ 로그인 후 /admin/account 에서 즉시 변경하세요.");
}

/**
 * 하루치 fill 인원을 4개 슬롯에 분배.
 * Why: 마감/잔여를 슬롯 단위로도 현실감 있게 표현. 앞 슬롯부터 정원껏 채워
 * 균등이 아닌 "선착순 소진" 패턴을 모사한다. 반환은 슬롯별 채울 인원수 배열.
 */
function distributeFill(totalFill: number): number[] {
  const perSlot = SLOT_LABELS.map(() => 0);
  let remaining = totalFill;
  for (let i = 0; i < SLOT_LABELS.length && remaining > 0; i++) {
    const take = Math.min(SLOT_CAPACITY, remaining);
    perSlot[i] = take;
    remaining -= take;
  }
  return perSlot;
}

async function seedReservationDomain() {
  // 멱등성 가드: 동일 제목 행사가 있으면 재시드하지 않는다 (admin 가드와 동일 규율)
  const existingEvent = await prisma.event.findFirst({
    where: { title: EVENT_TITLE },
  });
  if (existingEvent) {
    console.log(`이미 행사 데이터가 존재합니다: ${EVENT_TITLE}`);
    return;
  }

  // 단일 트랜잭션으로 Event/TimeSlot/Reservation 일괄 생성.
  // Why: 중간 실패 시 부분 시드로 멱등성 가드가 무력화되는 것을 방지.
  await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        title: EVENT_TITLE,
        startDate: localMidnight("2026-06-10"),
        endDate: localMidnight("2026-06-15"),
        active: true,
      },
    });

    for (const { date, remaining } of DAY_SNAPSHOT) {
      const totalFill = DAILY_CAPACITY - remaining; // 채울 인원수
      const fillPerSlot = distributeFill(totalFill);
      const slotDate = localMidnight(date);

      for (let i = 0; i < SLOT_LABELS.length; i++) {
        const slot = await tx.timeSlot.create({
          data: {
            eventId: event.id,
            date: slotDate,
            label: SLOT_LABELS[i],
            capacity: SLOT_CAPACITY,
            sortOrder: i,
          },
        });

        // 슬롯을 채우는 더미 예약 (status confirmed). headcount 1로 fill 인원만큼 생성.
        // Why: 잔여석 계산식(capacity - SUM headcount)을 실제로 검증하기 위함.
        const fill = fillPerSlot[i];
        if (fill > 0) {
          await tx.reservation.createMany({
            data: Array.from({ length: fill }, (_, n) => ({
              slotId: slot.id,
              name: `사전예약${i + 1}-${n + 1}`,
              dong: "0000",
              ho: "0000",
              phone: "01000000000",
              headcount: 1,
              status: "confirmed",
            })),
          });
        }
      }
    }
  });

  console.log("예약 도메인 시드 완료");
  console.log(`  행사: ${EVENT_TITLE}`);
  console.log(`  날짜별 잔여석: 06-11=19, 06-12=7, 06-13=마감, 06-14=마감, 06-15=2`);
}

async function main() {
  await seedAdmin();
  await seedReservationDomain();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
