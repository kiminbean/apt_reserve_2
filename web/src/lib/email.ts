import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

// @MX:NOTE: [AUTO] 이메일 발송 서비스 — Nodemailer + Gmail SMTP
// 환경변수: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

/**
 * SMTP 전송자 생성.
 * Why: 매 요청마다 transporter를 생성하면 연결 오버헤드가 크므로 lazy singleton 패턴 사용.
 * 환경변수가 없으면 폴백으로 null을 반환하여 이메일 기능이 선택적이 되도록 한다.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT?.trim()) || 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/** 발신자 이메일 주소 */
function getFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "";
}

/**
 * 예약 확인 이메일 템플릿.
 * Why: 인라인 HTML로 외부 템플릿 엔진 불필요. 이메일 클라이언트 호환성을 위해
 * 테이블 레이아웃과 인라인 스타일을 사용한다.
 */
export function buildConfirmationHtml(data: {
  name: string;
  dong: string;
  ho: string;
  eventTitle: string;
  date: string;
  timeLabel: string;
  headcount: number;
  cancelUrl: string;
}): string {
  const formattedDate = new Date(data.date);
  const dateStr = `${formattedDate.getFullYear()}년 ${formattedDate.getMonth() + 1}월 ${formattedDate.getDate()}일`;

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Malgun Gothic',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
    <tr>
      <td style="background:#242424;padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:bold;">방문</span><span style="color:#fd391f;font-size:18px;font-weight:bold;">예약</span>
        <span style="color:#aaa;font-size:13px;margin-left:8px;">예약 확인 안내</span>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="font-size:15px;margin:0 0 16px;"><strong>${data.name}</strong>님, 예약이 정상적으로 접수되었습니다.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #eee;border-radius:4px;">
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;width:90px;">행사명</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${data.eventTitle}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;">방문일</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${dateStr}</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;">시간대</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${data.timeLabel}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;">동/호수</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${data.dong}동 ${data.ho}호</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;color:#666;">참여 인원</td>
            <td style="padding:10px 12px;">${data.headcount}명</td>
          </tr>
        </table>
        <p style="font-size:12px;color:#999;margin:16px 0 0;">※ 예약 취소가 필요한 경우 아래 버튼을 클릭해 주세요.</p>
        <a href="${data.cancelUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#666;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;">예약 취소</a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;">
        <p style="margin:0;font-size:11px;color:#999;">본 메일은 발신 전용입니다. 문의는 담당자에게 연락해 주세요.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 예약 취소 이메일 템플릿.
 */
export function buildCancellationHtml(data: {
  name: string;
  dong: string;
  ho: string;
  eventTitle: string;
  date: string;
  timeLabel: string;
}): string {
  const formattedDate = new Date(data.date);
  const dateStr = `${formattedDate.getFullYear()}년 ${formattedDate.getMonth() + 1}월 ${formattedDate.getDate()}일`;

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Malgun Gothic',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
    <tr>
      <td style="background:#242424;padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:bold;">방문</span><span style="color:#fd391f;font-size:18px;font-weight:bold;">예약</span>
        <span style="color:#aaa;font-size:13px;margin-left:8px;">예약 취소 안내</span>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="font-size:15px;margin:0 0 16px;"><strong>${data.name}</strong>님, 예약이 취소되었습니다.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #eee;border-radius:4px;">
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;width:90px;">행사명</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${data.eventTitle}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;">방문일</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${dateStr}</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#666;">시간대</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;">${data.timeLabel}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;color:#666;">동/호수</td>
            <td style="padding:10px 12px;">${data.dong}동 ${data.ho}호</td>
          </tr>
        </table>
        <p style="font-size:12px;color:#999;margin:16px 0 0;">다시 예약이 필요한 경우 예약 페이지를 이용해 주세요.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;">
        <p style="margin:0;font-size:11px;color:#999;">본 메일은 발신 전용입니다. 문의는 담당자에게 연락해 주세요.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface SendConfirmationParams {
  reservationId: number;
  name: string;
  dong: string;
  ho: string;
  phone: string;
  slotId: number;
  headcount: number;
}

/**
 * 예약 확인 이메일 발송.
 * Why: SMTP 미설정 시 자동 스킵하여 이메일이 선택적 기능이 되도록 한다.
 * 에러가 나면 로그만 남기고 예약 자체는 성공 처리한다 (이메일은 부가 기능).
 */
export async function sendConfirmationEmail(params: SendConfirmationParams): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email] SMTP 미설정 — 확인 이메일 스킵");
    return false;
  }

  try {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: params.slotId },
      include: { event: true },
    });
    if (!slot?.event) return false;

    // 전화번호를 이메일 형식으로 변환할 수 없으므로, 이메일 발송은 보류
    // Why: 현재 스키마에 이메일 필드가 없음. 전화번호만으로는 이메일 발송 불가.
    // 실제 서비스에서는 예약 폼에 email 필드를 추가해야 함.
    console.log(`[email] 예약 #${params.reservationId} 확인 이메일 — 이메일 필드 미구현으로 스킵`);
    return false;
  } catch (error) {
    console.error("[email] 확인 이메일 발송 오류:", error);
    return false;
  }
}

/**
 * 관리자에게 새 예약 알림 이메일 발송.
 * Why: 관리자가 즉시 새 예약을 인지할 수 있도록 알림 메일 발송.
 */
export async function sendAdminNotification(params: {
  reservationId: number;
  name: string;
  dong: string;
  ho: string;
  phone: string;
  headcount: number;
  slotId: number;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    console.log("[email] ADMIN_EMAIL 미설정 — 관리자 알림 스킵");
    return false;
  }

  try {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: params.slotId },
      include: { event: true },
    });
    if (!slot?.event) return false;

    const formattedDate = new Date(slot.date);
    const dateStr = `${formattedDate.getFullYear()}-${String(formattedDate.getMonth() + 1).padStart(2, "0")}-${String(formattedDate.getDate()).padStart(2, "0")}`;

    const text = `[새 예약 접수]
예약번호: #${params.reservationId}
이름: ${params.name}
동/호: ${params.dong}동 ${params.ho}호
연락처: ${params.phone}
인원: ${params.headcount}명
행사: ${slot.event.title}
방문일: ${dateStr}
시간대: ${slot.label}`;

    await transporter.sendMail({
      from: getFromAddress(),
      to: adminEmail,
      subject: `[방문예약] 새 예약 접수 — ${params.name} (${dateStr} ${slot.label})`,
      text,
    });

    return true;
  } catch (error) {
    console.error("[email] 관리자 알림 발송 오류:", error);
    return false;
  }
}

/**
 * 예약 취소 이메일 발송 (관리자가 취소한 경우).
 * Why: 현재 스키마에 고객 이메일이 없으므로 관리자에게만 취소 알림 발송.
 */
export async function sendCancellationNotification(params: {
  reservationId: number;
  name: string;
  dong: string;
  ho: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) return false;

  try {
    const text = `[예약 취소]
예약번호: #${params.reservationId}
이름: ${params.name}
동/호: ${params.dong}동 ${params.ho}호
관리자에 의해 취소되었습니다.`;

    await transporter.sendMail({
      from: getFromAddress(),
      to: adminEmail,
      subject: `[방문예약] 예약 취소 — ${params.name}`,
      text,
    });

    return true;
  } catch (error) {
    console.error("[email] 취소 알림 발송 오류:", error);
    return false;
  }
}
