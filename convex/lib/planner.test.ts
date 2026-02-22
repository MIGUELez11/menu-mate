import { describe, expect, it } from "vitest";
import { validatePlanConstraints } from "./planner";

describe("validatePlanConstraints", () => {
	it("returns max-per-week hard violation", () => {
		const result = validatePlanConstraints(
			[
				{ recipeId: "r1", date: "2026-02-23", mealType: "dinner" },
				{ recipeId: "r1", date: "2026-02-24", mealType: "lunch" },
			],
			[
				{
					recipeId: "r1",
					name: "Tortilla",
					likeScore: 5,
					maxPerWeek: 1,
					allowConsecutiveDays: true,
				},
			],
		);

		expect(result.isValid).toBe(false);
		expect(result.violations.some((violation) => violation.type === "maxPerWeek")).toBe(true);
	});

	it("returns min-per-week hard violation", () => {
		const result = validatePlanConstraints(
			[{ recipeId: "r2", date: "2026-02-23", mealType: "dinner" }],
			[
				{
					recipeId: "r2",
					name: "Guiso",
					likeScore: 4,
					minPerWeek: 2,
					allowConsecutiveDays: true,
				},
			],
		);

		expect(result.isValid).toBe(false);
		expect(result.violations.some((violation) => violation.type === "minPerWeek")).toBe(true);
	});

	it("applies soft score when target differs", () => {
		const result = validatePlanConstraints(
			[{ recipeId: "r3", date: "2026-02-23", mealType: "dinner" }],
			[
				{
					recipeId: "r3",
					name: "Pasta",
					likeScore: 5,
					targetPerWeek: 3,
					allowConsecutiveDays: true,
				},
			],
		);

		expect(result.isValid).toBe(true);
		expect(result.softScore).toBe(20);
	});

	it("detects consecutive-day violation", () => {
		const result = validatePlanConstraints(
			[
				{ recipeId: "r4", date: "2026-02-23", mealType: "dinner" },
				{ recipeId: "r4", date: "2026-02-24", mealType: "dinner" },
			],
			[
				{
					recipeId: "r4",
					name: "Stew",
					likeScore: 4,
					allowConsecutiveDays: false,
				},
			],
		);

		expect(result.violations.some((violation) => violation.type === "consecutiveDays")).toBe(true);
	});

	it("detects min-gap-day violation", () => {
		const result = validatePlanConstraints(
			[
				{ recipeId: "r5", date: "2026-02-23", mealType: "dinner" },
				{ recipeId: "r5", date: "2026-02-25", mealType: "breakfast" },
			],
			[
				{
					recipeId: "r5",
					name: "Fish",
					likeScore: 4,
					allowConsecutiveDays: true,
					minGapDays: 3,
				},
			],
		);

		expect(result.violations.some((violation) => violation.type === "minGapDays")).toBe(true);
	});
});
