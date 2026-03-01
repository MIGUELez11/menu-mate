import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

async function createUnit(
	t: ReturnType<typeof convexTest>,
	name = "grams",
	abbreviation = "g",
) {
	return t.mutation(api.units.create, { name, abbreviation });
}

describe("ingredients", () => {
	test("create stores an ingredient", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		const id = await t.mutation(api.ingredients.create, {
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		const ingredient = await t.query(api.ingredients.getById, { id });
		expect(ingredient).toMatchObject({
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
	});

	test("create stores optional description", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		const id = await t.mutation(api.ingredients.create, {
			name: "flour",
			description: "All-purpose flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		const ingredient = await t.query(api.ingredients.getById, { id });
		expect(ingredient?.description).toBe("All-purpose flour");
	});

	test("create throws when primaryUnitId is not in allowedUnitIds", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		const otherId = await createUnit(t, "kilograms", "kg");
		await expect(
			t.mutation(api.ingredients.create, {
				name: "flour",
				allowedUnitIds: [unitId],
				primaryUnitId: otherId,
			}),
		).rejects.toThrow("primaryUnitId must be one of allowedUnitIds");
	});

	test("list returns all ingredients", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		await t.mutation(api.ingredients.create, {
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await t.mutation(api.ingredients.create, {
			name: "sugar",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		const ingredients = await t.query(api.ingredients.list, {});
		expect(ingredients).toHaveLength(2);
	});

	test("list with search filters by name", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		await t.mutation(api.ingredients.create, {
			name: "all-purpose flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await t.mutation(api.ingredients.create, {
			name: "bread flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await t.mutation(api.ingredients.create, {
			name: "sugar",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		const results = await t.query(api.ingredients.list, { search: "flour" });
		expect(results).toHaveLength(2);
	});

	test("update changes ingredient fields", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		const kgId = await createUnit(t, "kilograms", "kg");
		const id = await t.mutation(api.ingredients.create, {
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await t.mutation(api.ingredients.update, {
			id,
			name: "Flour",
			description: "Updated",
			allowedUnitIds: [unitId, kgId],
			primaryUnitId: kgId,
		});
		const ingredient = await t.query(api.ingredients.getById, { id });
		expect(ingredient).toMatchObject({
			name: "Flour",
			description: "Updated",
			primaryUnitId: kgId,
		});
	});

	test("update throws when primaryUnitId is not in allowedUnitIds", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		const kgId = await createUnit(t, "kilograms", "kg");
		const id = await t.mutation(api.ingredients.create, {
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await expect(
			t.mutation(api.ingredients.update, {
				id,
				name: "flour",
				allowedUnitIds: [unitId],
				primaryUnitId: kgId,
			}),
		).rejects.toThrow("primaryUnitId must be one of allowedUnitIds");
	});

	test("deleteIngredient removes the ingredient", async () => {
		const t = convexTest(schema, modules);
		const unitId = await createUnit(t);
		const id = await t.mutation(api.ingredients.create, {
			name: "flour",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await t.mutation(api.ingredients.deleteIngredient, { id });
		const ingredient = await t.query(api.ingredients.getById, { id });
		expect(ingredient).toBeNull();
	});
});
