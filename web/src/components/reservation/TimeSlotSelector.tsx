'use client';

import type { CalendarTimeSlot } from '@/types/reservation';

interface TimeSlotSelectorProps {
  timeSlots: CalendarTimeSlot[];
  selectedSlotId: string | null;
  onSlotSelect: (slotId: string) => void;
  disabled?: boolean;
}

export default function TimeSlotSelector({
  timeSlots,
  selectedSlotId,
  onSlotSelect,
  disabled = false,
}: TimeSlotSelectorProps) {
  return (
    <select
      value={selectedSlotId || ''}
      onChange={(e) => onSlotSelect(e.target.value)}
      disabled={disabled}
      className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white appearance-none"
      style={{
        backgroundImage: disabled
          ? 'none'
          : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '95% 50%',
      }}
      aria-label="참여 시간대 선택"
    >
      <option value="">참여 시간대 선택</option>
      {timeSlots.map((slot) => (
        <option key={slot.id} value={slot.id}>
          {slot.startTime} - {slot.endTime} (잔여 {slot.remaining}명)
        </option>
      ))}
    </select>
  );
}
