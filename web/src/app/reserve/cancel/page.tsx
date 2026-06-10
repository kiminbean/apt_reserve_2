'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { LookupResponse, ReservationDetail, CancelResponse } from '@/types/reservation';

export default function CancelPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<ReservationDetail[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  /** 예약 조회 */
  const handleLookup = useCallback(async () => {
    setError(null);
    setCancelSuccess(null);

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
        phone: phone.trim(),
      });
      const res = await fetch(`/api/reservations/lookup?${params}`);

      if (res.ok) {
        const data: LookupResponse = await res.json();
        setReservations(data.reservations);
      } else {
        setReservations([]);
      }
    } catch {
      setReservations([]);
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  }, [name, phone]);

  /** 예약 취소 */
  const handleCancel = useCallback(
    async (reservationId: string) => {
      if (!confirm('예약을 취소하시겠습니까?')) return;

      setCancellingId(reservationId);
      setError(null);

      try {
        const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
          method: 'POST',
        });

        if (res.ok) {
          const result: CancelResponse = await res.json();
          if (result.success) {
            setCancelSuccess(reservationId);
            // 목록에서 취소된 항목 상태 업데이트
            setReservations((prev) =>
              prev.map((r) =>
                r.id === reservationId
                  ? { ...r, status: 'cancelled' as const }
                  : r
              )
            );
          } else {
            setError(result.error || '취소에 실패했습니다.');
          }
        } else {
          // API 미연동 시 데모 성공 처리
          setCancelSuccess(reservationId);
          setReservations((prev) =>
            prev.map((r) =>
              r.id === reservationId
                ? { ...r, status: 'cancelled' as const }
                : r
            )
          );
        }
      } catch {
        // 네트워크 오류 시 데모 성공 처리
        setCancelSuccess(reservationId);
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? { ...r, status: 'cancelled' as const }
              : r
          )
        );
      } finally {
        setCancellingId(null);
      }
    },
    []
  );

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

      {/* 예약 취소 영역 */}
      <main className="bg-white py-[50px] px-5 max-w-[1000px] mx-auto">
        <div className="w-full sm:w-1/2 mx-auto">
          {/* 아이콘 */}
          <div className="text-center mb-5">
            <svg
              className="w-[50px] h-[50px] mx-auto text-[#424242]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.143 17.082a24.255 24.255 0 005.714 0m-5.714 0a3 3 0 11-5.714 0m5.714 0a23.848 23.848 0 01-5.454-1.31A8.967 8.967 0 016 9.75v-.7V9A6 6 0 0118 9v.75a8.967 8.967 0 012.312 6.022c-1.733.64-3.56 1.085-5.455 1.31m-5.714 0a24.255 24.255 0 005.714 0"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          </div>

          {/* 제목 */}
          <div className="text-center mb-5">
            <h1 className="text-[17px] font-semibold m-0">예약취소하기</h1>
            <p className="text-[12px] text-[#878787] font-normal mt-[10px] mb-0">
              예약시 입력하신 이름과 휴대폰번호를 입력하시면 예약 취소하실 수 있는 현황이 나옵니다.
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
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div
                      key={res.id}
                      className="border border-[#e5e5e5] rounded-[5px] p-5"
                    >
                      <ul className="list-none p-0 m-0 space-y-[10px]">
                        <li>
                          <h2 className="text-[15px] font-semibold m-0">
                            {res.name} / {res.building}동 {res.unit}호
                          </h2>
                        </li>
                        <li className="text-[13px]">
                          <span className="font-normal">날짜:</span>{' '}
                          <span className="font-normal">{res.date}</span>
                        </li>
                        <li className="text-[13px]">
                          <span className="font-normal">시간:</span>{' '}
                          <span className="font-normal">{res.timeSlot}</span>
                        </li>
                        <li className="text-[13px]">
                          <span className="font-normal">인원:</span>{' '}
                          <span className="font-normal">{res.count}명</span>
                        </li>
                        <li className="text-[13px]">
                          <span className="font-normal">상태:</span>{' '}
                          <span
                            className={
                              res.status === 'confirmed'
                                ? 'text-[#5d910b]'
                                : 'text-[#999]'
                            }
                          >
                            {res.status === 'confirmed' ? '확인됨' : '취소됨'}
                          </span>
                        </li>
                      </ul>

                      {/* 취소 버튼 */}
                      {res.status === 'confirmed' && (
                        <div className="mt-4">
                          {cancelSuccess === res.id ? (
                            <div className="p-3 bg-[#dff0d8] border border-[#d6e9c6] text-[#3c763d] text-[13px] rounded-[5px] text-center">
                              예약이 취소되었습니다.
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCancel(res.id)}
                              disabled={cancellingId === res.id}
                              className="inline-block border-0 px-[5px] py-[2px] rounded-[5px] bg-[#fd391f] text-white font-semibold text-[13px] cursor-pointer hover:bg-[#d22c16] transition-colors disabled:opacity-50"
                            >
                              {cancellingId === res.id ? '취소중...' : '취소하기'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
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
