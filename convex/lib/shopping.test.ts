import { describe, expect, it } from "vitest";
import { computeShoppingDeficits } from "./shopping";

describe("computeShoppingDeficits", () => {
	it("aggregates recipe needs and subtracts pantry quantities", () => {
		const result = computeShoppingDeficits(
			[
				{ ingredientId: "i1", ingredientName: "Tomato", quantity: 2, unit: "kg" },
				{ ingredientId: "i1", ingredientName: "Tomato", quantity: 1, unit: "kg" },
			],
			[{ ingredientId: "i1", quantity: 0.5, unit: "kg" }],
		);

		expect(result.deficits).toEqual([
			{
				ingredientId: "i1",
				ingredientName: "Tomato",
				needed: 3,
				inPantry: 0.5,
				toBuy: 2.5,
				unit: "kg",
			},
		]);
	});

	it("never returns negative deficits", () => {
		const result = computeShoppingDeficits(
			[{ ingredientId: "i2", ingredientName: "Egg", quantity: 6, unit: "unit" }],
			[{ ingredientId: "i2", quantity: 12, unit: "unit" }],
		);

		expect(result.deficits).toEqual([]);
	});

	it("reports unresolved unit conflicts", () => {
		const result = computeShoppingDeficits(
			[{ ingredientId: "i3", ingredientName: "Flour", quantity: 1, unit: "kg" }],
			[{ ingredientId: "i3", quantity: 500, unit: "g" }],
		);

		expect(result.unresolvedUnitConflicts).toEqual([
			{
				ingredientId: "i3",
				ingredientName: "Flour",
				recipeUnits: ["kg"],
				pantryUnits: ["g"],
			},
		]);
	});
});
