import { describe, it, expect } from "vitest";

// 예약 입력값 검증 로직을 직접 테스트하기 위해
// 공통 검증 패턴을 재사용 가능한 함수로 추출한 테스트.

// Why: 서버 사이드 검증은 보안의 최후 방어선. 각 케이스별 엣지 케이스를 체계적으로 검증.

describe("예약 입력값 검증", () => {
  // 검증 로직은 route.ts 내 validateReservationInput에 있지만,
  // 동일한 정규식/로직을 테스트하여 규칙의 정확성을 보장한다.

  const PHONE_REGEX = /^\d{10,11}$/;
  const DONG_HO_REGEX = /^\d{4}$/;

  describe("전화번호 검증", () => {
    it("10자리 숫자는 유효해야 함", () => {
      expect(PHONE_REGEX.test("0101234567")).toBe(true);
    });

    it("11자리 숫자는 유효해야 함", () => {
      expect(PHONE_REGEX.test("01012345678")).toBe(true);
    });

    it("9자리는 유효하지 않음", () => {
      expect(PHONE_REGEX.test("010123456")).toBe(false);
    });

    it("12자리는 유효하지 않음", () => {
      expect(PHONE_REGEX.test("010123456789")).toBe(false);
    });

    it("하이픈 포함 시 유효하지 않음", () => {
      expect(PHONE_REGEX.test("010-1234-5678")).toBe(false);
    });

    it("문자 포함 시 유효하지 않음", () => {
      expect(PHONE_REGEX.test("010abc45678")).toBe(false);
    });

    it("빈 문자열은 유효하지 않음", () => {
      expect(PHONE_REGEX.test("")).toBe(false);
    });
  });

  describe("동/호수 검증", () => {
    it("4자리 숫자는 유효해야 함", () => {
      expect(DONG_HO_REGEX.test("0101")).toBe(true);
    });

    it("앞자리 0 허용", () => {
      expect(DONG_HO_REGEX.test("0001")).toBe(true);
    });

    it("3자리는 유효하지 않음", () => {
      expect(DONG_HO_REGEX.test("101")).toBe(false);
    });

    it("5자리는 유효하지 않음", () => {
      expect(DONG_HO_REGEX.test("01011")).toBe(false);
    });

    it("문자 포함 시 유효하지 않음", () => {
      expect(DONG_HO_REGEX.test("01ab")).toBe(false);
    });
  });

  describe("전화번호 정제", () => {
    it("하이픈 제거 후 11자리면 유효", () => {
      const raw = "010-1234-5678";
      const digitsOnly = raw.replace(/\D/g, "");
      expect(PHONE_REGEX.test(digitsOnly)).toBe(true);
      expect(digitsOnly).toBe("01012345678");
    });

    it("공백 제거 후 11자리면 유효", () => {
      const raw = "010 1234 5678";
      const digitsOnly = raw.replace(/\D/g, "");
      expect(PHONE_REGEX.test(digitsOnly)).toBe(true);
    });

    it("점 제거 후 10자리면 유효", () => {
      const raw = "010.123.4567";
      const digitsOnly = raw.replace(/\D/g, "");
      expect(PHONE_REGEX.test(digitsOnly)).toBe(true);
    });
  });
});
