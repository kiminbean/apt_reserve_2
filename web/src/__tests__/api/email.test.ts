import { describe, it, expect, vi, beforeEach } from "vitest";

// Why: 이메일 서비스의 핵심 로직을 격리 테스트.
// SMTP 미설정 시 graceful degradation 동작을 검증한다.

// nodemailer 모킹
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// prisma 모킹
vi.mock("@/lib/db", () => ({
  prisma: {
    timeSlot: {
      findUnique: vi.fn(),
    },
  },
}));

describe("이메일 서비스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 환경변수 초기화
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;
    delete process.env.ADMIN_EMAIL;
  });

  describe("SMTP 미설정 시", () => {
    it("환경변수 없으면 getTransporter가 null을 반환해야 함", async () => {
      // 동적 import로 모듈 재로드
      const { sendAdminNotification } = await import("@/lib/email");

      const result = await sendAdminNotification({
        reservationId: 1,
        name: "홍길동",
        dong: "0101",
        ho: "0202",
        phone: "01012345678",
        headcount: 2,
        slotId: 1,
      });

      expect(result).toBe(false);
    });
  });

  describe("SMTP 설정 시", () => {
    it("ADMIN_EMAIL 미설정이면 관리자 알림이 스킵되어야 함", async () => {
      // SMTP 설정은 있지만 ADMIN_EMAIL이 없는 경우
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "test@gmail.com";
      process.env.SMTP_PASS = "test-password";

      const { sendAdminNotification } = await import("@/lib/email");

      const result = await sendAdminNotification({
        reservationId: 1,
        name: "홍길동",
        dong: "0101",
        ho: "0202",
        phone: "01012345678",
        headcount: 2,
        slotId: 1,
      });

      expect(result).toBe(false);
    });
  });
});
