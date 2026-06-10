'use client';

import { useState, useCallback, useMemo } from 'react';
import type { TimeSlot } from '@/types/reservation';
import TimeSlotSelector from './TimeSlotSelector';

// 개인정보 처리방침 텍스트
const PRIVACY_POLICY = `[개인정보 처리방침]
안녕하세요. 저희 방문 예약에 참여해 주셔서 진심으로 감사드립니다.
주)팀레드는 아파트 방문 행사 대행업체로서 방문 예약을 희망하는 고객님을 위해 예약 서비스를 진행하고 있으며 고객님의 개인정보를 일부 수집하고 있습니다.
본 예약 시스템을 통해 신청 시 고객님의 개인정보가 웹서버에 저장되오니 심사숙고하여 신청해 주시기 바랍니다.
1. 개인정보의 수집 - 이용 목적 : 아파트 방문 행사 예약을 위한 상담 및 예약 서비스 제공
2. 수집하는 개인정보 항목 : 이름, 연락처, 동호수, 참여시간, 참여날짜
3. 개인정보의 보유 : 신청 후 3개월 보관 (요청 시 즉시 파기).`;

interface ReservationFormProps {
  selectedDate: string | null;
  timeSlots: TimeSlot[];
  onSubmit: (formData: {
    name: string;
    building: string;
    unit: string;
    phone: string;
    date: string;
    timeSlotId: string;
    count: number;
    agreePrivacy: boolean;
  }) => void;
  isSubmitting: boolean;
}

export default function ReservationForm({
  selectedDate,
  timeSlots,
  onSubmit,
  isSubmitting,
}: ReservationFormProps) {
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 선택된 시간대의 잔여 인원
  const selectedSlot = useMemo(
    () => timeSlots.find((s) => s.id === selectedSlotId),
    [timeSlots, selectedSlotId]
  );

  // 참여 인원수 옵션 (1 ~ 잔여인원)
  const countOptions = useMemo(() => {
    if (!selectedSlot) return [];
    const max = Math.max(selectedSlot.remaining, 1);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [selectedSlot]);

  /** 숫자만 입력 허용 */
  const handleDigitsOnly = useCallback(
    (setter: (val: string) => void, maxLen: number) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, maxLen);
        setter(digits);
      },
    []
  );

  /** 폼 제출 */
  const handleSubmit = useCallback(() => {
    setError(null);

    // 유효성 검사 (clone의 getNext 함수와 동일한 순서)
    if (!name.trim()) {
      setError('신청자명을 입력해주세요.');
      return;
    }
    if (!building.trim()) {
      setError('동을 입력해주세요.');
      return;
    }
    if (!unit.trim()) {
      setError('호수를 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      setError('연락처를 입력해주세요.');
      return;
    }
    if (!selectedDate) {
      setError('예약하실 날짜를 선택해주세요.');
      return;
    }
    if (!selectedSlotId) {
      setError('참여 가능한 시간대를 선택해주세요.');
      return;
    }
    if (count < 1) {
      setError('참여 인원수를 선택해주세요.');
      return;
    }
    if (!agreePrivacy) {
      setError('개인정보 처리방침에 동의후 예약이 가능합니다.');
      return;
    }

    onSubmit({
      name: name.trim(),
      building,
      unit,
      phone,
      date: selectedDate,
      timeSlotId: selectedSlotId,
      count,
      agreePrivacy,
    });
  }, [name, building, unit, phone, selectedDate, selectedSlotId, count, agreePrivacy, onSubmit]);

  /** 날짜 변경 시 시간대/인원 초기화 */
  const handleSlotSelect = useCallback((slotId: string) => {
    setSelectedSlotId(slotId);
    setCount(0);
  }, []);

  return (
    <div className="w-full sm:w-1/2 mx-auto mt-5">
      <ul className="list-none p-0 m-0">
        {/* 계약자 이름 */}
        <li className="float-left w-full sm:w-[49%] sm:mr-[2%] mb-[2%]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="계약자 이름"
            maxLength={20}
            className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white"
            aria-label="계약자 이름"
          />
        </li>

        {/* 동/호수 입력 */}
        <li className="float-left w-full sm:w-[49%] sm:mr-0 mb-[2%]">
          <dl className="flex gap-[4%] m-0 p-0">
            <dt className="flex-1 m-0 p-0">
              <input
                type="text"
                value={building}
                onChange={handleDigitsOnly(setBuilding, 4)}
                placeholder="동 입력"
                maxLength={4}
                className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white"
                aria-label="동 입력 (숫자 4자리)"
                inputMode="numeric"
              />
            </dt>
            <dt className="flex-1 m-0 p-0">
              <input
                type="text"
                value={unit}
                onChange={handleDigitsOnly(setUnit, 4)}
                placeholder="호수 입력"
                maxLength={4}
                className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white"
                aria-label="호수 입력 (숫자 4자리)"
                inputMode="numeric"
              />
            </dt>
          </dl>
        </li>

        {/* 계약자 연락처 */}
        <li className="float-left w-full sm:w-[49%] sm:mr-[2%] mb-[2%]">
          <input
            type="text"
            value={phone}
            onChange={handleDigitsOnly(setPhone, 11)}
            placeholder="계약자 연락처"
            maxLength={11}
            className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white"
            aria-label="계약자 연락처"
            inputMode="tel"
          />
        </li>

        {/* 날짜 표시 (readonly) */}
        <li className="float-left w-full sm:w-[49%] sm:mr-0 mb-[2%]">
          <input
            type="text"
            value={selectedDate || ''}
            readOnly
            placeholder="달력에서 날짜 선택시 자동 입력"
            className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-[#eee]"
            aria-label="선택된 예약 날짜"
          />
        </li>

        {/* 안내 문구 */}
        <li className="float-left w-full mb-[2%]">
          <p className="text-[13px] text-red-600 m-0">
            ※계약자 이름과 계약자 연락처를 입력해주셔야 정상적으로 예약이 완료됩니다.
          </p>
        </li>

        {/* 참여 시간대 선택 */}
        <li className="float-left w-full sm:w-[49%] sm:mr-[2%] mb-[2%]">
          <TimeSlotSelector
            timeSlots={timeSlots}
            selectedSlotId={selectedSlotId}
            onSlotSelect={handleSlotSelect}
            disabled={!selectedDate}
          />
        </li>

        {/* 참여 인원수 선택 */}
        <li className="float-left w-full sm:w-[49%] sm:mr-0 mb-[2%]">
          <select
            value={count || ''}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={!selectedSlotId}
            className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white appearance-none disabled:bg-[#eee]"
            style={{
              backgroundImage: !selectedSlotId
                ? 'none'
                : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '95% 50%',
            }}
            aria-label="참여 인원수 선택"
          >
            <option value="">참여 인원수 선택</option>
            {countOptions.map((n) => (
              <option key={n} value={n}>
                {n}명
              </option>
            ))}
          </select>
        </li>

        {/* 개인정보 처리방침 */}
        <li className="float-left w-full mb-[2%]">
          <textarea
            readOnly
            value={PRIVACY_POLICY}
            className="w-full h-[100px] p-[10px] border border-[#e5e5e5] text-[#878787] text-[13px] font-normal bg-white resize-none"
            aria-label="개인정보 처리방침"
          />
        </li>

        {/* 동의 체크박스 */}
        <li className="float-left w-full text-center mb-[2%]">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[13px]">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="w-4 h-4"
            />
            <span>개인정보 처리방침에 동의합니다.</span>
          </label>
        </li>

        {/* 에러 메시지 */}
        {error && (
          <li className="float-left w-full mb-2">
            <div className="p-3 bg-[#f2dede] border border-[#ebccd1] text-[#a94442] text-[13px] rounded-[5px]">
              {error}
            </div>
          </li>
        )}

        {/* 예약하기 버튼 */}
        <li className="float-left w-full mt-[10px]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="block w-full h-[60px] leading-[60px] text-center text-[17px] bg-[#fd391f] text-white font-semibold rounded-[5px] border-0 cursor-pointer hover:bg-[#d22c16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '예약 처리중...' : '예약하기'}
          </button>
        </li>
      </ul>
    </div>
  );
}
