'use client';

import { useState } from 'react';
import type { DateSlot, CalendarCell } from '@/types/reservation';

// 요일 헤더 (일=빨강, 토=파랑)
const DAY_HEADERS = [
  { label: '일', className: 'text-[#d9534f]' },
  { label: '월', className: '' },
  { label: '화', className: '' },
  { label: '수', className: '' },
  { label: '목', className: '' },
  { label: '금', className: '' },
  { label: '토', className: 'text-[#428bca]' },
] as const;

interface CalendarProps {
  slots: DateSlot[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

/** 월별 달력 그리드 생성 */
function buildCalendarGrid(
  year: number,
  month: number,
  slots: DateSlot[]
): CalendarCell[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // 날짜별 슬롯 맵 구성 (빠른 조회용)
  const slotMap = new Map<string, DateSlot>();
  for (const slot of slots) {
    slotMap.set(slot.date, slot);
  }

  const cells: CalendarCell[] = [];

  // 이전 달 빈 셀
  for (let i = 0; i < firstDay; i++) {
    cells.push({
      date: 0,
      fullDate: '',
      status: 'empty',
      remaining: 0,
      dayOfWeek: i,
    });
  }

  // 현재 달 날짜 셀
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const slot = slotMap.get(fullDate);

    if (slot && slot.isAvailable) {
      cells.push({
        date: d,
        fullDate,
        status: 'live',
        remaining: slot.remaining,
        dayOfWeek,
      });
    } else if (slot && !slot.isAvailable && slot.remaining === 0) {
      // 마감된 날짜 (잔여 0)
      cells.push({
        date: d,
        fullDate,
        status: 'imposs',
        remaining: 0,
        dayOfWeek,
      });
    } else if (slot) {
      cells.push({
        date: d,
        fullDate,
        status: 'imposs',
        remaining: slot.remaining,
        dayOfWeek,
      });
    } else {
      // 슬롯 데이터 없음 = 불가능
      cells.push({
        date: d,
        fullDate,
        status: 'imposs',
        remaining: 0,
        dayOfWeek,
      });
    }
  }

  // 다음 달 빈 셀 (7의 배수로 맞추기)
  const remainder = cells.length % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({
        date: 0,
        fullDate: '',
        status: 'empty',
        remaining: 0,
        dayOfWeek: (cells.length + i) % 7,
      });
    }
  }

  // 7개씩 행으로 분할
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export default function Calendar({ slots, selectedDate, onDateSelect }: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const rows = buildCalendarGrid(currentYear, currentMonth, slots);

  /** 이전 달 이동 */
  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  /** 다음 달 이동 */
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  /** 날짜 클릭 핸들러 */
  const handleDateClick = (cell: CalendarCell) => {
    if (cell.status === 'live' && cell.fullDate) {
      onDateSelect(cell.fullDate);
    }
  };

  return (
    <div className="w-full min-h-[300px]">
      {/* 월 네비게이션 */}
      <nav className="py-[10px]">
        <ul className="flex items-center justify-center gap-0 list-none m-0 p-0">
          <li>
            <button
              onClick={goToPrevMonth}
              className="inline-block px-[14px] py-[5px] bg-white border border-[#ddd] rounded-[10px] text-sm cursor-pointer hover:bg-[#eee] transition-colors"
              type="button"
              aria-label="이전달"
            >
              <span className="hidden sm:inline">이전달</span>
              <span className="sm:hidden">&#8249;</span>
            </button>
          </li>
          <li>
            <strong className="mx-[4px] text-base font-normal leading-[1.4]">
              <span className="font-['Montserrat']">{currentYear}</span>
              <span className="hidden sm:inline">년</span>
              <span className="sm:hidden">.</span>{' '}
              <span className="font-['Montserrat']">{String(currentMonth).padStart(2, '0')}</span>
              <span className="hidden sm:inline">월</span>
            </strong>
          </li>
          <li>
            <button
              onClick={goToNextMonth}
              className="inline-block px-[14px] py-[5px] bg-white border border-[#ddd] rounded-[10px] text-sm cursor-pointer hover:bg-[#eee] transition-colors"
              type="button"
              aria-label="다음달"
            >
              <span className="hidden sm:inline">다음달</span>
              <span className="sm:hidden">&#8250;</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* 달력 테이블 */}
      <table className="w-full border-collapse border border-[#ddd] tbl-calendar">
        <caption className="sr-only">
          방문 예약 달력
        </caption>
        <thead>
          <tr>
            {DAY_HEADERS.map((day, i) => (
              <th
                key={day.label}
                className={`w-[14.285714%] py-[8px] px-0 text-center border border-[#ddd] font-weight-medium text-sm ${
                  i === 0 ? 'bg-[#FFFAF6]' : ''
                } ${i === 6 ? 'bg-[#F6FAFF]' : ''}`}
              >
                <span className={day.className}>{day.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="h-[30px]">
              {row.map((cell, cellIdx) => {
                // 일요일/토요일 배경
                const isSunday = cellIdx === 0;
                const isSaturday = cellIdx === 6;

                // 기본 클래스
                let tdClass = 'border border-[#ddd] align-middle';

                if (cell.status === 'empty') {
                  // 빈 셀
                  return <td key={cellIdx} className={tdClass} />;
                }

                if (cell.status === 'imposs') {
                  // 예약 불가 (회색 배경)
                  tdClass += ' bg-[#f5f5f5]';
                  if (isSunday) tdClass += ' bg-[#FFFAF6]';
                  if (isSaturday) tdClass += ' bg-[#F6FAFF]';
                  return (
                    <td key={cellIdx} className={tdClass}>
                      <div className="text-center py-[10px] sm:py-0 block sm:table-cell">
                        <span
                          className={`font-['Montserrat'] text-[11px] ${
                            cell.remaining === 0 && cell.fullDate
                              ? 'text-[#7d7d7d]'
                              : isSunday
                                ? 'text-[#d9534f]'
                                : isSaturday
                                  ? 'text-[#428bca]'
                                  : 'text-[#7d7d7d]'
                          }`}
                        >
                          {cell.date}
                        </span>
                        {cell.remaining === 0 && cell.fullDate && (
                          <div className="text-[11px] text-[#7d7d7d] font-['돋움',Dotum,Verdana,applegothic] tracking-[-1px]">
                            마감
                          </div>
                        )}
                      </div>
                    </td>
                  );
                }

                // 예약 가능 (live) 또는 선택됨 (danger)
                const isSelected = selectedDate === cell.fullDate;
                if (isSelected) {
                  tdClass += ' bg-[#f2dede]';
                } else {
                  tdClass += ' bg-white cursor-pointer hover:bg-[#f5f5f5]';
                }

                return (
                  <td
                    key={cellIdx}
                    className={tdClass}
                    onClick={() => handleDateClick(cell)}
                    role={cell.status === 'live' ? 'button' : undefined}
                    tabIndex={cell.status === 'live' ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDateClick(cell);
                      }
                    }}
                  >
                    <div className="text-center py-[10px] sm:py-0 block sm:table-cell">
                      <span
                        className={`font-['Montserrat'] text-[11px] ${
                          isSunday
                            ? 'text-[#d9534f]'
                            : isSaturday
                              ? 'text-[#428bca]'
                              : 'text-[#333]'
                        }`}
                      >
                        {cell.date}
                      </span>
                      {cell.remaining > 0 && (
                        <div className="m-remain-cnt font-['돋움',Dotum,Verdana,applegothic] text-[11px] tracking-[-1px] text-[#7b7b7b]">
                          (잔여{cell.remaining})
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
