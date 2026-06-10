// 예약 시스템 타입 정의
// Why: API 응답 스키마와 UI 컴포넌트 타입을 명확히 분리.
//   API 타입은 백엔드 응답을 그대로 반영하고, UI 타입은 컴포넌트가 소비하기 편한 형태.

// ─── API 응답 타입 (백엔드가 반환하는 실제 형식) ───

/** GET /api/reservations/event — 활성 행사의 슬롯 정보 */
export interface ApiSlot {
  id: number;
  date: string;        // "2026-06-11T00:00:00.000Z" 또는 로컬 자정 Date
  label: string;       // "10:00 ~ 11:00"
  capacity: number;
  remaining: number;
  sortOrder: number;
}

/** GET /api/reservations/event 응답 */
export interface EventResponse {
  event: {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
  };
  slots: ApiSlot[];
}

/** POST /api/reservations 응답 */
export interface CreateReservationResponse {
  success: boolean;
  reservation?: {
    id: number;
    name: string;
    buildingNo: string;
    unitNo: string;
    phone: string;
    date: string | null;
    timeSlot: string | null;
    headCount: number;
    createdAt: string;
  };
  error?: string;
}

/** GET /api/reservations/lookup 응답 개별 항목 */
export interface LookupReservation {
  id: number;
  name: string;
  buildingNo: string;
  unitNo: string;
  phone: string;
  date: string;
  startTime: string;     // 슬롯 label, 예: "10:00 ~ 11:00"
  endTime: string | null;
  headCount: number;
  status: 'confirmed' | 'canceled';
  createdAt: string;
}

/** GET /api/reservations/lookup 응답 */
export interface LookupResponse {
  reservations: LookupReservation[];
}

/** POST /api/reservations/[id]/cancel 응답 */
export interface CancelResponse {
  success: boolean;
  error?: string;
}

// ─── UI 컴포넌트 타입 (Calendar 등이 소비하는 파생 형식) ───

/** 달력에서 사용하는 시간대 슬롯 (API 슬롯에서 파생) */
export interface CalendarTimeSlot {
  id: number;
  startTime: string;     // "10:00"
  endTime: string;       // "11:00"
  capacity: number;
  remaining: number;
}

/** 달력에서 사용하는 날짜별 슬롯 (API 슬롯을 날짜별로 그룹핑) */
export interface DateSlot {
  date: string;          // "2026-06-11"
  remaining: number;     // 해당 날짜 총 잔여석
  isAvailable: boolean;  // remaining > 0
  timeSlots: CalendarTimeSlot[];
}

/** 달력 날짜 셀 상태 */
export type DateCellStatus = 'empty' | 'imposs' | 'live';

/** 달력 날짜 셀 */
export interface CalendarCell {
  date: number;
  fullDate: string;
  status: DateCellStatus;
  remaining: number;
  dayOfWeek: number;
}

// ─── 유틸리티 함수 ───

/**
 * API 슬롯 배열 → Calendar용 DateSlot[] 변환.
 * Why: API는 flat 슬롯 목록을 반환하지만 Calendar는 날짜별 그룹핑이 필요.
 *   슬롯 label("10:00 ~ 11:00")을 startTime/endTime으로 분해하고
 *   날짜별로 그룹핑하여 Calendar가 소비할 수 있는 형태로 변환한다.
 */
export function transformSlotsToDateSlots(slots: ApiSlot[]): DateSlot[] {
  // 날짜 문자열(YYYY-MM-DD)별 그룹핑
  const dateMap = new Map<string, ApiSlot[]>();

  for (const slot of slots) {
    // TimeSlot.date는 KST 자정 = UTC 15:00(전날). UTC 앞 10자리를 그대로 쓰면
    //   하루 앞 날짜로 밀리므로(예: 06-11이 06-10으로) 반드시 KST 기준으로 날짜를 추출한다.
    // en-CA 로케일은 'YYYY-MM-DD' 포맷을 보장한다.
    const dateStr = new Date(slot.date).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Seoul',
    });

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, []);
    }
    dateMap.get(dateStr)!.push(slot);
  }

  const result: DateSlot[] = [];

  for (const [date, dateSlots] of dateMap) {
    // 날짜 내 슬롯을 sortOrder순으로 정렬
    const sorted = [...dateSlots].sort((a, b) => a.sortOrder - b.sortOrder);

    // 날짜 총 잔여석 = 각 슬롯 잔여석 합
    const totalRemaining = sorted.reduce((sum, s) => sum + s.remaining, 0);

    // API 슬롯 → CalendarTimeSlot 변환
    const timeSlots: CalendarTimeSlot[] = sorted.map((s) => {
      // label 파싱: "10:00 ~ 11:00" → startTime="10:00", endTime="11:00"
      const parts = s.label.split('~').map((p) => p.trim());
      return {
        id: s.id,
        startTime: parts[0] ?? s.label,
        endTime: parts[1] ?? '',
        capacity: s.capacity,
        remaining: s.remaining,
      };
    });

    result.push({
      date,
      remaining: totalRemaining,
      isAvailable: totalRemaining > 0,
      timeSlots,
    });
  }

  // 날짜순 정렬
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
