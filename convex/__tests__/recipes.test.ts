import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

const AUTHOR = { subject: "user_author" };
const OTHER = { subject: "user_other" };

const baseRecipe = {
	name: "Pasta Carbonara",
	portions: 2,
	cookTimeMinutes: 30,
	difficulty: "easy" as const,
	tags: ["italian"],
	tips: [],
};

describe("recipes", () => {
	test("create stores recipe with correct fields and authorId", async () => {
		const t = convexTest(schema, modules);
		const id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		const recipe = await t.query(api.recipes.getById, { id });
		expect(recipe).toMatchObject({
			name: "Pasta Carbonara",
			portions: 2,
			cookTimeMinutes: 30,
			difficulty: "easy",
			tags: ["italian"],
			authorId: AUTHOR.subject,
		});
	});

	test("list returns all recipes regardless of caller", async () => {
		const t = convexTest(schema, modules);
		await t.withIdentity(AUTHOR).mutation(api.recipes.create, baseRecipe);
		await t
			.withIdentity(OTHER)
			.mutation(api.recipes.create, { ...baseRecipe, name: "Pizza" });
		const recipes = await t.withIdentity(OTHER).query(api.recipes.list, {});
		expect(recipes).toHaveLength(2);
	});

	test("getById returns recipe with ingredients and steps", async () => {
		const t = convexTest(schema, modules);
		const id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		const recipe = await t.query(api.recipes.getById, { id });
		expect(recipe).toMatchObject({ name: "Pasta Carbonara" });
		expect(recipe?.ingredients).toEqual([]);
		expect(recipe?.steps).toEqual([]);
	});

	test("update: author can update recipe", async () => {
		const t = convexTest(schema, modules);
		const id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		await t.withIdentity(AUTHOR).mutation(api.recipes.update, {
			id,
			name: "Spaghetti Carbonara",
			portions: 4,
			cookTimeMinutes: 30,
			difficulty: "easy" as const,
			tags: ["italian"],
			tips: [],
		});
		const recipe = await t.query(api.recipes.getById, { id });
		expect(recipe?.name).toBe("Spaghetti Carbonara");
		expect(recipe?.portions).toBe(4);
	});

	test("update: non-author cannot update recipe", async () => {
		const t = convexTest(schema, modules);
		const id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		await expect(
			t.withIdentity(OTHER).mutation(api.recipes.update, {
				id,
				name: "Hacked",
				portions: 1,
				cookTimeMinutes: 10,
				difficulty: "easy" as const,
				tags: [],
				tips: [],
			}),
		).rejects.toThrow("Not authorized");
	});

	test("remove: author can delete recipe", async () => {
		const t = convexTest(schema, modules);
		const id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		await t.withIdentity(AUTHOR).mutation(api.recipes.remove, { id });
		const recipe = await t.query(api.recipes.getById, { id });
		expect(recipe).toBeNull();
	});

	test("remove: non-author cannot delete recipe", async () => {
		const t = convexTest(schema, modules);
		const id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		await expect(
			t.withIdentity(OTHER).mutation(api.recipes.remove, { id }),
		).rejects.toThrow("Not authorized");
	});

	test("addIngredient stores ingredient under recipe", async () => {
		const t = convexTest(schema, modules);
		const recipeId = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		const unitId = await t.mutation(api.units.create, {
			name: "grams",
			abbreviation: "g",
		});
		const ingredientId = await t.mutation(api.ingredients.create, {
			name: "pancetta",
			allowedUnitIds: [unitId],
			primaryUnitId: unitId,
		});
		await t.withIdentity(AUTHOR).mutation(api.recipes.addIngredient, {
			recipeId,
			ingredientId,
			quantity: 150,
		});
		const recipe = await t.query(api.recipes.getById, { id: recipeId });
		expect(recipe?.ingredients).toHaveLength(1);
		expect(recipe?.ingredients[0]).toMatchObject({
			ingredientId,
			quantity: 150,
		});
	});

	test("addStep stores step under recipe", async () => {
		const t = convexTest(schema, modules);
		const recipeId = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		await t.withIdentity(AUTHOR).mutation(api.recipes.addStep, {
			recipeId,
			text: "Boil water",
		});
		const recipe = await t.query(api.recipes.getById, { id: recipeId });
		expect(recipe?.steps).toHaveLength(1);
		expect(recipe?.steps[0].text).toBe("Boil water");
		expect(recipe?.steps[0].order).toBe(1);
	});

	test("reorderSteps returns steps in new order", async () => {
		const t = convexTest(schema, modules);
		const recipeId = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.create, baseRecipe);
		const step1Id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.addStep, { recipeId, text: "Step A" });
		const step2Id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.addStep, { recipeId, text: "Step B" });
		const step3Id = await t
			.withIdentity(AUTHOR)
			.mutation(api.recipes.addStep, { recipeId, text: "Step C" });
		// Reorder: C, A, B
		await t.withIdentity(AUTHOR).mutation(api.recipes.reorderSteps, {
			recipeId,
			stepIds: [step3Id, step1Id, step2Id],
		});
		const recipe = await t.query(api.recipes.getById, { id: recipeId });
		expect(recipe?.steps.map((s: { text: string }) => s.text)).toEqual([
			"Step C",
			"Step A",
			"Step B",
		]);
	});
});
