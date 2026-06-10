// 예약 시스템 타입 정의

/** 이벤트 정보 */
export interface EventInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  contactPhone: string;
}

/** 시간대 슬롯 정보 */
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remaining: number;
}

/** 날짜별 슬롯 정보 */
export interface DateSlot {
  date: string;
  remaining: number;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

/** 이벤트 응답 (GET /api/reservations/event) */
export interface EventResponse {
  event: EventInfo;
  slots: DateSlot[];
}

/** 예약 생성 요청 (POST /api/reservations) */
export interface CreateReservationRequest {
  name: string;
  building: string;
  unit: string;
  phone: string;
  date: string;
  timeSlotId: string;
  count: number;
  agreePrivacy: boolean;
}

/** 예약 생성 응답 */
export interface CreateReservationResponse {
  success: boolean;
  reservation?: {
    id: string;
    name: string;
    date: string;
    timeSlot: string;
    count: number;
  };
  error?: string;
}

/** 예약 조회 응답 (GET /api/reservations/lookup) */
export interface LookupResponse {
  reservations: ReservationDetail[];
}

/** 예약 상세 정보 */
export interface ReservationDetail {
  id: string;
  name: string;
  building: string;
  unit: string;
  phone: string;
  date: string;
  timeSlot: string;
  count: number;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

/** 예약 취소 응답 (POST /api/reservations/[id]/cancel) */
export interface CancelResponse {
  success: boolean;
  error?: string;
}

/** 달력 날짜 셀 상태 */
export type DateCellStatus = 'empty' | 'imposs' | 'live' | 'danger';

/** 달력 날짜 셀 */
export interface CalendarCell {
  date: number;
  fullDate: string;
  status: DateCellStatus;
  remaining: number;
  dayOfWeek: number;
}
