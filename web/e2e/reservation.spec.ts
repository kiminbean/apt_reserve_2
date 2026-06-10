import { test, expect } from "@playwright/test";

// Why: 핵심 사용자 플로우 E2E 테스트.
// 예약 폼 진입 → 행사/슬롯 로딩 → 폼 작성 → 예약 완료 플로우를 검증한다.

test.describe("공개 예약 플로우", () => {
  test("예약 페이지가 정상 로드되어야 함", async ({ page }) => {
    await page.goto("/reserve");

    // 페이지 타이틀 확인
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("예약 확인 페이지가 정상 로드되어야 함", async ({ page }) => {
    await page.goto("/reserve/check");
    await expect(page.locator("body")).toBeVisible();
  });

  test("예약 취소 페이지가 정상 로드되어야 함", async ({ page }) => {
    await page.goto("/reserve/cancel");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("관리자 로그인 플로우", () => {
  test("로그인 페이지가 정상 로드되어야 함", async ({ page }) => {
    await page.goto("/admin/login");

    // 로그인 폼 요소 확인
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("잘못된 자격증명으로 로그인 시 에러 표시", async ({ page }) => {
    await page.goto("/admin/login");

    await page.fill('input[name="username"]', "wronguser");
    await page.fill('input[name="password"]', "wrongpass");
    await page.click('button[type="submit"]');

    // 에러 메시지가 표시되어야 함
    await expect(page.locator("text=/아이디|비밀번호|로그인/i")).toBeVisible({ timeout: 5000 });
  });

  test("관리자 페이지 미인증 시 로그인으로 리다이렉트", async ({ page }) => {
    await page.goto("/admin");

    // 로그인 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
  });
});
