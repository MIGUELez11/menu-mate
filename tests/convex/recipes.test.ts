import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s", { eager: false });

describe("recipes", () => {
	async function setup(t: ReturnType<typeof convexTest>) {
		const asUser = t.withIdentity({ subject: "user1" });
		const dishId = await asUser.mutation(api.dishes.create, {
			name: "Pasta",
			mealType: "dinner" as const,
			likeness: 4,
			minTimesPerWeek: 1,
			maxTimesPerWeek: 3,
		});
		const ingredientId = await asUser.mutation(api.ingredients.create, {
			name: "Spaghetti",
			unit: "g",
		});
		return { asUser, dishId, ingredientId };
	}

	it("getByDish returns null when no recipe exists", async () => {
		const t = convexTest(schema, modules);
		const { asUser, dishId } = await setup(t);
		const result = await asUser.query(api.recipes.getByDish, { dishId });
		expect(result).toBeNull();
	});

	it("createForDish creates recipe", async () => {
		const t = convexTest(schema, modules);
		const { asUser, dishId } = await setup(t);
		const recipeId = await asUser.mutation(api.recipes.createForDish, {
			dishId,
			servings: 4,
		});
		const result = await asUser.query(api.recipes.getByDish, { dishId });
		expect(result).not.toBeNull();
		expect(result!._id).toBe(recipeId);
		expect(result!.servings).toBe(4);
	});

	it("addIngredient adds to recipe", async () => {
		const t = convexTest(schema, modules);
		const { asUser, dishId, ingredientId } = await setup(t);
		const recipeId = await asUser.mutation(api.recipes.createForDish, {
			dishId,
			servings: 2,
		});
		await asUser.mutation(api.recipes.addIngredient, {
			recipeId,
			ingredientId,
			quantity: 200,
			unit: "g",
		});
		const result = await asUser.query(api.recipes.getByDish, { dishId });
		expect(result!.ingredients).toHaveLength(1);
		expect(result!.ingredients[0].quantity).toBe(200);
		expect(result!.ingredients[0].ingredient!.name).toBe("Spaghetti");
	});

	it("removeIngredient removes from recipe", async () => {
		const t = convexTest(schema, modules);
		const { asUser, dishId, ingredientId } = await setup(t);
		const recipeId = await asUser.mutation(api.recipes.createForDish, {
			dishId,
			servings: 2,
		});
		const riId = await asUser.mutation(api.recipes.addIngredient, {
			recipeId,
			ingredientId,
			quantity: 100,
			unit: "g",
		});
		await asUser.mutation(api.recipes.removeIngredient, {
			recipeIngredientId: riId,
		});
		const result = await asUser.query(api.recipes.getByDish, { dishId });
		expect(result!.ingredients).toHaveLength(0);
	});

	it("updateIngredient updates quantity", async () => {
		const t = convexTest(schema, modules);
		const { asUser, dishId, ingredientId } = await setup(t);
		const recipeId = await asUser.mutation(api.recipes.createForDish, {
			dishId,
			servings: 2,
		});
		const riId = await asUser.mutation(api.recipes.addIngredient, {
			recipeId,
			ingredientId,
			quantity: 100,
			unit: "g",
		});
		await asUser.mutation(api.recipes.updateIngredient, {
			recipeIngredientId: riId,
			quantity: 300,
		});
		const result = await asUser.query(api.recipes.getByDish, { dishId });
		expect(result!.ingredients[0].quantity).toBe(300);
	});

	it("createForDish throws when unauthenticated", async () => {
		const t = convexTest(schema, modules);
		const { dishId } = await setup(t);
		await expect(
			t.mutation(api.recipes.createForDish, { dishId, servings: 1 }),
		).rejects.toThrow("Not authenticated");
	});
});
