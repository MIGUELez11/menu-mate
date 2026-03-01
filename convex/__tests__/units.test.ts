import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

describe("units", () => {
	test("create stores a unit with name and abbreviation", async () => {
		const t = convexTest(schema, modules);
		const id = await t.mutation(api.units.create, {
			name: "grams",
			abbreviation: "g",
		});
		const unit = await t.query(api.units.getById, { id });
		expect(unit).toMatchObject({ name: "grams", abbreviation: "g" });
	});

	test("list returns all units", async () => {
		const t = convexTest(schema, modules);
		await t.mutation(api.units.create, { name: "grams", abbreviation: "g" });
		await t.mutation(api.units.create, {
			name: "kilograms",
			abbreviation: "kg",
		});
		const units = await t.query(api.units.list, {});
		expect(units).toHaveLength(2);
	});

	test("list with search filters by name", async () => {
		const t = convexTest(schema, modules);
		await t.mutation(api.units.create, { name: "grams", abbreviation: "g" });
		await t.mutation(api.units.create, {
			name: "kilograms",
			abbreviation: "kg",
		});
		await t.mutation(api.units.create, {
			name: "milliliters",
			abbreviation: "ml",
		});
		const units = await t.query(api.units.list, { search: "gram" });
		expect(units).toHaveLength(2);
		expect(units.map((u) => u.name)).toContain("grams");
		expect(units.map((u) => u.name)).toContain("kilograms");
	});

	test("update changes name and abbreviation", async () => {
		const t = convexTest(schema, modules);
		const id = await t.mutation(api.units.create, {
			name: "grams",
			abbreviation: "g",
		});
		await t.mutation(api.units.update, {
			id,
			name: "Grams",
			abbreviation: "gr",
		});
		const unit = await t.query(api.units.getById, { id });
		expect(unit).toMatchObject({ name: "Grams", abbreviation: "gr" });
	});

	test("deleteUnit removes the unit", async () => {
		const t = convexTest(schema, modules);
		const id = await t.mutation(api.units.create, {
			name: "grams",
			abbreviation: "g",
		});
		await t.mutation(api.units.deleteUnit, { id });
		const unit = await t.query(api.units.getById, { id });
		expect(unit).toBeNull();
	});

	test("deleteUnit throws when unit is used by an ingredient", async () => {
		const t = convexTest(schema, modules);
		const unitId = await t.mutation(api.units.create, {
			name: "grams",
			abbreviation: "g",
		});
		await t.mutation(api.ingredients.create, {
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await expect(
			t.mutation(api.units.deleteUnit, { id: unitId }),
		).rejects.toThrow(/Cannot delete unit/);
	});
});
