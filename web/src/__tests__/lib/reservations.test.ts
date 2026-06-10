import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma 모킹
const mockPrisma = {
  reservation: {
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  event: {
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  timeSlot: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

describe("잔여석 계산 로직", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("잔여석 = 정원 - 확정 예약 합계", async () => {
    // capacity 5, confirmed 예약 headcount 합계 3 → 잔여 2
    mockPrisma.timeSlot.findUnique.mockResolvedValue({ capacity: 5 });
    mockPrisma.reservation.aggregate.mockResolvedValue({
      _sum: { headcount: 3 },
    });

    const { getRemainingForSlot } = await import("@/lib/reservations");
    const remaining = await getRemainingForSlot(1);

    expect(remaining).toBe(2);
  });

  it("정원과 동일한 예약이면 잔여 0", async () => {
    mockPrisma.timeSlot.findUnique.mockResolvedValue({ capacity: 5 });
    mockPrisma.reservation.aggregate.mockResolvedValue({
      _sum: { headcount: 5 },
    });

    const { getRemainingForSlot } = await import("@/lib/reservations");
    const remaining = await getRemainingForSlot(1);

    expect(remaining).toBe(0);
  });

  it("예약이 없으면 잔여 = 정원", async () => {
    mockPrisma.timeSlot.findUnique.mockResolvedValue({ capacity: 5 });
    mockPrisma.reservation.aggregate.mockResolvedValue({
      _sum: { headcount: null },
    });

    const { getRemainingForSlot } = await import("@/lib/reservations");
    const remaining = await getRemainingForSlot(1);

    expect(remaining).toBe(5);
  });

  it("슬롯이 없으면 null 반환", async () => {
    mockPrisma.timeSlot.findUnique.mockResolvedValue(null);

    const { getRemainingForSlot } = await import("@/lib/reservations");
    const remaining = await getRemainingForSlot(999);

    expect(remaining).toBeNull();
  });

  it("초과 예약 시에도 잔여는 0으로 클램프", async () => {
    // 정원 5인데 예약 합계 7 → 잔여는 음수가 아닌 0
    mockPrisma.timeSlot.findUnique.mockResolvedValue({ capacity: 5 });
    mockPrisma.reservation.aggregate.mockResolvedValue({
      _sum: { headcount: 7 },
    });

    const { getRemainingForSlot } = await import("@/lib/reservations");
    const remaining = await getRemainingForSlot(1);

    expect(remaining).toBe(0);
  });
});

describe("attachRemaining 다중 슬롯 잔여석", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("빈 슬롯 배열은 빈 결과 반환", async () => {
    const { attachRemaining } = await import("@/lib/reservations");
    const result = await attachRemaining([]);
    expect(result).toEqual([]);
  });

  it("여러 슬롯의 잔여석을 groupBy 1회로 계산", async () => {
    const slots = [
      { id: 1, capacity: 5, eventId: 1, date: new Date(), label: "10:00", sortOrder: 0 },
      { id: 2, capacity: 5, eventId: 1, date: new Date(), label: "11:00", sortOrder: 1 },
    ];

    mockPrisma.reservation.groupBy.mockResolvedValue([
      { slotId: 1, _sum: { headcount: 3 } },
      { slotId: 2, _sum: { headcount: 0 } },
    ]);

    const { attachRemaining } = await import("@/lib/reservations");
    const result = await attachRemaining(slots as Awaited<ReturnType<typeof attachRemaining>>);

    expect(result).toHaveLength(2);
    expect(result[0].remaining).toBe(2);  // 5 - 3
    expect(result[1].remaining).toBe(5);  // 5 - 0
    // groupBy는 1회만 호출되어야 함 (N+1 방지)
    expect(mockPrisma.reservation.groupBy).toHaveBeenCalledTimes(1);
  });
});
