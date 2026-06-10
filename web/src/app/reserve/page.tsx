'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { EventResponse, DateSlot, CreateReservationResponse } from '@/types/reservation';
import { transformSlotsToDateSlots } from '@/types/reservation';
import Calendar from '@/components/reservation/Calendar';
import ReservationForm from '@/components/reservation/ReservationForm';
import type { CalendarTimeSlot } from '@/types/reservation';

export default function ReservePage() {
  const [slots, setSlots] = useState<DateSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API에서 행사+슬롯 데이터 로드
  useEffect(() => {
    async function loadEventData() {
      try {
        const res = await fetch('/api/reservations/event');
        if (res.ok) {
          const data: EventResponse = await res.json();
          // flat API 슬롯 → Calendar용 DateSlot[] 변환
          setSlots(transformSlotsToDateSlots(data.slots));
        } else {
          setErrorMessage('현재 진행 중인 행사가 없습니다.');
        }
      } catch {
        setErrorMessage('행사 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEventData();
  }, []);

  /** 선택된 날짜의 시간대 슬롯 */
  const currentTimeSlots: CalendarTimeSlot[] = selectedDate
    ? slots.find((s) => s.date === selectedDate)?.timeSlots ?? []
    : [];

  /** 날짜 선택 핸들러 */
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  /** 폼 제출 핸들러 */
  const handleSubmit = useCallback(
    async (formData: {
      name: string;
      building: string;
      unit: string;
      phone: string;
      date: string;
      timeSlotId: string;
      count: number;
      agreePrivacy: boolean;
    }) => {
      setIsSubmitting(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      try {
        // Why: 폼 필드명(building/unit/count/timeSlotId:string)을
        //   API가 기대하는 필드명(buildingNo/unitNo/headCount/timeSlotId:number)으로 변환
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            buildingNo: formData.building,
            unitNo: formData.unit,
            phone: formData.phone,
            timeSlotId: Number(formData.timeSlotId),
            headCount: formData.count,
          }),
        });

        const result: CreateReservationResponse = await res.json();

        if (res.ok && result.success) {
          const r = result.reservation;
          // 날짜 포맷: API가 Date 객체를 반환할 수 있으므로 안전하게 처리
          const dateStr = r?.date
            ? new Date(r.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
            : formData.date;
          setSuccessMessage(
            `${formData.name}님, 예약이 완료되었습니다.\n날짜: ${dateStr}\n인원: ${formData.count}명`
          );
        } else {
          setErrorMessage(result.error || '예약에 실패했습니다. 다시 시도해주세요.');
        }
      } catch {
        setErrorMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* GNB 헤더 */}
      <header className="bg-white h-[80px] leading-[80px] px-5 mb-[10px] max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-normal">
            <Link href="/" className="text-[#242424] no-underline">
              방문<span className="text-[#fd391f] font-semibold">예약페이지</span>
            </Link>
          </div>
          <div>
            <h1 className="text-[17px] text-[#424242] font-normal m-0">
              예약관련문의 : <span className="font-semibold">010-9338-0809</span>
            </h1>
          </div>
        </div>
      </header>

      {/* 예약 메인 영역 */}
      <main className="bg-white py-[50px] px-5 max-w-[1000px] w-full mx-auto flex-1">
        {/* 공지사항 */}
        <div className="border border-[#e5e5e5] bg-[#fafafa] rounded-[5px] p-[10px] text-left mb-5">
          <p className="text-[12px] font-normal leading-[22px] mt-0 mb-[8.5px]">
            <i className="fas fa-exclamation-circle" /> 원활한 행사진행을 위해 각각의 일자와 시간대에 <span className="font-semibold">정해진 수량의 세대만 예약이 가능</span>합니다.
          </p>
          <p className="text-[12px] font-normal leading-[22px] mt-0 mb-[8.5px]">
            <i className="fas fa-exclamation-circle" /> <span className="font-semibold">예약은 선착순</span>으로 진행됩니다. 만약 선택일자와 시간에 예약이 다 차게 되면 <span className="font-semibold">예약이 불가</span>하오니 다른 일자와 시간을 선택 부탁드립니다.
          </p>
          <p className="text-[12px] font-normal leading-[22px] mt-0 mb-[8.5px]">
            <i className="fas fa-exclamation-circle" /> 희망 하시는 날짜와 시간을 선택하신 후 <span className="font-semibold">예약</span>을 원하시는 날짜를 클릭해주세요.
          </p>
          <p className="text-[12px] font-normal leading-[22px] mt-0 mb-[8.5px]">
            <i className="fas fa-exclamation-circle" /> 예약은 <span className="font-semibold">계약자 성함</span> 으로 예약해주시고 세대당 행사 기간내 <span className="font-semibold">한번만 예약 가능</span>합니다.
          </p>
          <p className="text-[12px] font-normal leading-[22px] m-0">
            <i className="fas fa-exclamation-circle" /> 동호수 입력은 숫자 4자리씩 맞춰서 <span className="font-semibold">숫자만 기재</span>해주시기 바랍니다. ex)101-301 → 동입력:0101/호수입력:0301
          </p>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-10 text-[#777]">
            <p className="text-[15px] m-0">행사 정보를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {errorMessage && !isLoading && (
          <div className="max-w-[50%] mx-auto mb-5 p-5 bg-[#f2dede] border border-[#ebccd1] rounded-[5px] text-center">
            <p className="text-[15px] text-[#a94442] font-semibold m-0">{errorMessage}</p>
          </div>
        )}

        {/* 달력 — 데이터 로드 완료 후에만 렌더 */}
        {!isLoading && !errorMessage && slots.length > 0 && (
          <div className="my-5">
            <Calendar
              slots={slots}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>
        )}

        {/* 이벤트 정보 */}
        {!isLoading && slots.length > 0 && (
          <div className="text-center border-t border-[#e5e5e5] pt-5">
            <div className="mb-2">
              <h1 className="text-[30px] font-normal text-black m-0">
                태화강 센트럴 아이파크 유상 옵션 계약
              </h1>
            </div>
            <div className="w-[5%] h-[3px] bg-[#fd391f] mx-auto my-5" />
            <div>
              <p className="text-[19px] font-semibold text-black m-0">
                <i className="far fa-calendar-alt" /> 행사기간 : 2026년06월10일(수) ~ 2026년06월15일(월)
              </p>
            </div>
          </div>
        )}

        {/* 예약 성공 메시지 */}
        {successMessage && (
          <div className="max-w-[50%] mx-auto mt-5 p-5 bg-[#dff0d8] border border-[#d6e9c6] rounded-[5px] text-center">
            <p className="text-[15px] text-[#3c763d] font-semibold whitespace-pre-line m-0">
              {successMessage}
            </p>
          </div>
        )}

        {/* 예약 폼 — 날짜 선택 후에만 활성화 */}
        {!isLoading && !errorMessage && slots.length > 0 && (
          <ReservationForm
            selectedDate={selectedDate}
            timeSlots={currentTimeSlots}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>

      {/* 하단 푸터 */}
      <footer className="mt-[10px] py-5 text-center bg-[#242424] max-w-[1000px] mx-auto">
        <div className="my-[10px]">
          <h1 className="text-[17px] font-semibold text-white m-0">
            방문예약페이지
          </h1>
          <p className="text-[12px] text-white m-0 mt-2">
            APART RESERVATION SYSTEM
          </p>
        </div>
        <div className="mt-[10px]">
          <a href="/admin/login" className="text-white text-[12px]">
            [관리자모드]
          </a>
        </div>
      </footer>
    </div>
  );
}
