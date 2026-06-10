import Link from "next/link";

// Why: 원본 reserve-apt2.co.kr 메인 랜딩(clone/index.html)을 픽셀 단위로 재현.
//   반응형 분기점은 원본과 동일하게 1000px (Tailwind max-[1000px]: arbitrary variant).
export default function Home() {
  return (
    <div className="bg-[#f5f5f5]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="w-[1000px] max-[1000px]:w-full mx-auto">
        {/* GNB */}
        <div className="bg-white h-[80px] leading-[80px] px-5 mb-[10px] flex items-center justify-between max-[1000px]:h-[60px] max-[1000px]:leading-[60px] max-[1000px]:px-[10px]">
          <div className="text-[24px] max-[1000px]:text-[1.5em]">
            <Link href="/" className="text-[#242424] hover:text-[#fd391f] transition-colors">
              <i className="fas fa-history" /> 방문
              <span className="text-[#fd391f] font-semibold">예약페이지</span>
            </Link>
          </div>
          <div className="text-right">
            <h1 className="text-[17px] text-[#424242] font-normal m-0 max-[1000px]:text-[1.25em]">
              <i className="fas fa-headset" />{" "}
              <span className="max-[1000px]:hidden">예약관련문의 : </span>
              <span className="font-semibold">010-9338-0809</span>
            </h1>
          </div>
        </div>

        {/* Visual 히어로 */}
        <div
          className="py-[400px] text-center bg-center bg-cover bg-no-repeat max-[1000px]:py-[200px] max-[1000px]:px-[10px]"
          style={{ backgroundImage: "url('/data/common/logo_img')" }}
        >
          <div>
            <div className="my-[10px]">
              <h1 className="text-[42px] font-normal text-white m-0 max-[1000px]:text-[2em]">
                태화강 센트럴 아이파크
              </h1>
              <h1 className="text-[42px] font-normal text-white m-0 max-[1000px]:text-[2em]">
                유상 옵션 계약
              </h1>
              <h2 className="text-[24px] font-light text-white m-0 max-[1000px]:text-[1.25em]">
                <i className="far fa-calendar-alt" /> 기간 : 2026년 6월 10일(수) ~ 6월 15일(월) 6일간
              </h2>
            </div>
            <div className="w-[30%] mt-[20px] mx-auto max-[1000px]:w-1/2">
              <Link
                href="/reserve"
                className="btn-gradient-border block w-full h-[60px] leading-[50px] bg-black hover:bg-[#fd391f] text-white text-[24px] font-normal transition-colors max-[1000px]:h-[40px] max-[1000px]:leading-[30px] max-[1000px]:text-[1.05em]"
              >
                예약 접수 바로가기
              </Link>
            </div>
          </div>
        </div>

        {/* mct 섹션: 좌(예약확인/취소) + 우(공지사항) */}
        <div className="my-[10px] bg-white p-[10px] flex max-[1000px]:block">
          {/* type1: 예약확인 / 예약취소 */}
          <div className="float-left w-[485px] mr-[10px] text-center max-[1000px]:float-none max-[1000px]:w-full max-[1000px]:mr-0 max-[1000px]:flex max-[1000px]:gap-[2%]">
            <div className="mb-[10px] max-[1000px]:mb-0 max-[1000px]:w-[49%]">
              <Link
                href="/reserve/check"
                className="block w-full h-[70px] leading-[70px] border border-[#e5e5e5] text-[#242424] hover:bg-black hover:text-white text-[17px] font-normal transition-colors max-[1000px]:h-[50px] max-[1000px]:leading-[50px] max-[1000px]:text-[1.05em]"
              >
                <i className="far fa-clock" /> 예약확인
              </Link>
            </div>
            <div className="max-[1000px]:w-[49%]">
              <Link
                href="/reserve/cancel"
                className="block w-full h-[70px] leading-[70px] border border-[#e5e5e5] text-[#242424] hover:bg-black hover:text-white text-[17px] font-normal transition-colors max-[1000px]:h-[50px] max-[1000px]:leading-[50px] max-[1000px]:text-[1.05em]"
              >
                <i className="fas fa-ban" /> 예약취소
              </Link>
            </div>
          </div>

          {/* type2: 공지사항 */}
          <div className="float-left w-[485px] h-[150px] p-[10px] border border-[#e5e5e5] max-[1000px]:float-none max-[1000px]:w-full max-[1000px]:h-auto max-[1000px]:mt-[10px]">
            <div className="mb-[10px]">
              <h1 className="text-[17px] font-semibold text-[#242424] m-0 max-[1000px]:text-[1.25em]">
                공지사항
              </h1>
            </div>
            <div>
              <ul className="list-none p-0 m-0">
                <li className="block relative mb-[5px]">
                  <a
                    href="#"
                    className="text-[#242424] hover:text-[#fd391f] transition-colors"
                  >
                    <strong className="font-semibold">
                      안녕하세요. 방문 예약 방법을 안내해드립니다.
                    </strong>
                  </a>
                  <span className="absolute right-0 text-[#ccc] max-[1000px]:hidden">
                    2020-06-16
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-[10px] py-5 text-center bg-[#242424]">
          <div className="my-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/ft_logo.png"
              alt="logo"
              className="inline-block h-auto"
            />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-white m-0 max-[1000px]:text-[1.05em]">
              방문예약페이지
            </h1>
            <p className="text-[12px] text-white m-0 max-[1000px]:text-[1.05em]">
              APART RESERVATION SYSTEM
            </p>
          </div>
          <div className="mt-[10px]">
            <Link href="/admin/login" className="text-white hover:text-[#fd391f] transition-colors">
              [관리자모드]
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
