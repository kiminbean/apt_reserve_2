'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { LookupResponse, LookupReservation } from '@/types/reservation';

export default function CheckPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<LookupReservation[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 예약 조회 */
  const handleLookup = useCallback(async () => {
    setError(null);

    if (!name.trim()) {
      setError('예약자명을 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      setError('핸드폰번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setSearched(false);
    setReservations([]);

    try {
      const params = new URLSearchParams({
        name: name.trim(),
        phone: phone.trim().replace(/\D/g, ''),
      });
      const res = await fetch(`/api/reservations/lookup?${params}`);

      if (res.ok) {
        const data: LookupResponse = await res.json();
        setReservations(data.reservations);
      } else {
        const data = await res.json();
        setError(data.error || '조회 중 오류가 발생했습니다.');
        setReservations([]);
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setReservations([]);
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  }, [name, phone]);

  /** 날짜 포맷팅 헬퍼 */
  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }

  /** 상태 표시 */
  function statusLabel(status: string): string {
    return status === 'confirmed' ? '확인' : '취소';
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
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

      {/* 예약 확인 영역 */}
      <main className="bg-white py-[50px] px-5 max-w-[1000px] mx-auto">
        <div className="w-full sm:w-1/2 mx-auto">
          {/* 아이콘 */}
          <div className="text-center mb-5">
            <i className="far fa-bell text-[50px] text-[#424242]" aria-hidden="true" />
          </div>

          {/* 제목 */}
          <div className="text-center mb-5">
            <h1 className="text-[17px] font-semibold m-0">예약확인하기</h1>
            <p className="text-[12px] text-[#878787] font-normal mt-[10px] mb-0">
              <i className="fas fa-exclamation-circle" /> 예약시 입력하신 이름과 휴대폰번호를 입력하시면 예약현황이 출력됩니다.
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="mb-4">
            <ul className="list-none p-0 m-0">
              <li className="block mb-[10px]">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예약자명"
                  className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white"
                  aria-label="예약자명"
                />
              </li>
              <li className="block mb-[10px]">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="핸드폰번호"
                  maxLength={11}
                  className="block w-full h-[50px] leading-[50px] px-[10px] border border-[#e5e5e5] rounded-[5px] text-[13px] font-normal bg-white"
                  aria-label="핸드폰번호"
                  inputMode="tel"
                />
              </li>
            </ul>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-[#f2dede] border border-[#ebccd1] text-[#a94442] text-[13px] rounded-[5px]">
              {error}
            </div>
          )}

          {/* 확인 버튼 */}
          <div>
            <button
              type="button"
              onClick={handleLookup}
              disabled={isLoading}
              className="block w-full h-[60px] leading-[60px] text-center text-[17px] bg-[#fd391f] text-white font-semibold rounded-[5px] border-0 cursor-pointer hover:bg-[#d22c16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '확인중...' : '예약확인'}
            </button>
          </div>

          {/* 조회 결과 */}
          {searched && (
            <div className="mt-[50px]">
              {reservations.length === 0 ? (
                <div className="text-center py-10 text-[#777]">
                  <p className="text-[15px] m-0">조회된 예약 내역이 없습니다.</p>
                  <p className="text-[13px] m-0 mt-2">
                    입력하신 정보가 정확한지 확인해주세요.
                  </p>
                </div>
              ) : (
                <div className="border-b border-[#e5e5e5]">
                  {/* 테이블 헤더 */}
                  <ul className="list-none p-0 m-0 flex bg-[#eee] border-t border-[#fd391f]">
                    <li className="w-[20%] text-center py-5">예약자</li>
                    <li className="w-[15%] text-center py-5">동</li>
                    <li className="w-[15%] text-center py-5">호수</li>
                    <li className="w-[20%] text-center py-5">날짜</li>
                    <li className="w-[15%] text-center py-5">시간</li>
                    <li className="w-[15%] text-center py-5">상태</li>
                  </ul>

                  {/* 예약 목록 */}
                  {reservations.map((res) => (
                    <ul
                      key={res.id}
                      className="list-none p-0 m-0 flex border-b border-[#e5e5e5]"
                    >
                      <li className="w-[20%] text-center py-5">{res.name}</li>
                      <li className="w-[15%] text-center py-5">{res.buildingNo}</li>
                      <li className="w-[15%] text-center py-5">{res.unitNo}</li>
                      <li className="w-[20%] text-center py-5">{formatDate(res.date)}</li>
                      <li className="w-[15%] text-center py-5">{res.startTime}</li>
                      <li className="w-[15%] text-center py-5">
                        <span
                          className={
                            res.status === 'confirmed'
                              ? 'text-[#5d910b]'
                              : 'text-[#999]'
                          }
                        >
                          {statusLabel(res.status)}
                        </span>
                      </li>
                    </ul>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
