import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s", { eager: false });

describe("dishes", () => {
	const sampleDish = {
		name: "Pasta Bolognese",
		mealType: "dinner" as const,
		cuisineType: "Italian",
		likeness: 4,
		minTimesPerWeek: 1,
		maxTimesPerWeek: 3,
	};

	it("list returns empty for new user", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		expect(await asUser.query(api.dishes.list)).toEqual([]);
	});

	it("create and list dish", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		await asUser.mutation(api.dishes.create, sampleDish);
		const list = await asUser.query(api.dishes.list);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe("Pasta Bolognese");
	});

	it("get dish by id", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const id = await asUser.mutation(api.dishes.create, sampleDish);
		const dish = await asUser.query(api.dishes.get, { id });
		expect(dish).not.toBeNull();
		expect(dish!.name).toBe("Pasta Bolognese");
	});

	it("update dish", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const id = await asUser.mutation(api.dishes.create, sampleDish);
		await asUser.mutation(api.dishes.update, { id, likeness: 5 });
		const dish = await asUser.query(api.dishes.get, { id });
		expect(dish!.likeness).toBe(5);
	});

	it("remove dish", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const id = await asUser.mutation(api.dishes.create, sampleDish);
		await asUser.mutation(api.dishes.remove, { id });
		expect(await asUser.query(api.dishes.list)).toHaveLength(0);
	});

	it("cascade delete removes recipe and recipeIngredients", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });

		const dishId = await asUser.mutation(api.dishes.create, sampleDish);
		const ingredientId = await asUser.mutation(api.ingredients.create, {
			name: "Pasta",
			unit: "g",
		});
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

		await asUser.mutation(api.dishes.remove, { id: dishId });

		// Verify cascade
		const remainingRecipes = await t.run(async (ctx) => {
			return await ctx.db.query("recipes").collect();
		});
		const remainingRIs = await t.run(async (ctx) => {
			return await ctx.db.query("recipeIngredients").collect();
		});
		expect(remainingRecipes).toHaveLength(0);
		expect(remainingRIs).toHaveLength(0);
	});

	it("create throws when unauthenticated", async () => {
		const t = convexTest(schema, modules);
		await expect(
			t.mutation(api.dishes.create, sampleDish),
		).rejects.toThrow("Not authenticated");
	});

	it("list only returns dishes for authenticated user", async () => {
		const t = convexTest(schema, modules);
		const asUser1 = t.withIdentity({ subject: "user1" });
		const asUser2 = t.withIdentity({ subject: "user2" });
		await asUser1.mutation(api.dishes.create, sampleDish);
		expect(await asUser2.query(api.dishes.list)).toHaveLength(0);
	});
});
