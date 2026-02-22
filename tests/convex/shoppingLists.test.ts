import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s", { eager: false });

describe("shoppingLists", () => {
	async function setupPlanWithRecipe(
		asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
	) {
		const planId = await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
			name: "Test Plan",
		});
		const ingredientId = await asUser.mutation(api.ingredients.create, {
			name: "Pasta",
			unit: "g",
			category: "grains",
		});
		const ingredient2Id = await asUser.mutation(api.ingredients.create, {
			name: "Tomato",
			unit: "g",
			category: "vegetables",
		});
		const dishId = await asUser.mutation(api.dishes.create, {
			name: "Pasta Bolognese",
			mealType: "dinner" as const,
			likeness: 4,
			minTimesPerWeek: 1,
			maxTimesPerWeek: 3,
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
		await asUser.mutation(api.recipes.addIngredient, {
			recipeId,
			ingredientId: ingredient2Id,
			quantity: 150,
			unit: "g",
		});
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 0,
			mealType: "dinner" as const,
		});
		// Add same dish again on a different day → aggregates quantities
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 2,
			mealType: "dinner" as const,
		});
		return { planId, ingredientId, ingredient2Id, dishId, recipeId };
	}

	it("generate aggregates ingredients correctly", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const { planId } = await setupPlanWithRecipe(asUser);

		const listId = await asUser.mutation(api.shoppingLists.generate, {
			weeklyPlanId: planId,
		});
		const listWithItems = await asUser.query(api.shoppingLists.getWithItems, {
			listId,
		});
		expect(listWithItems).not.toBeNull();
		expect(listWithItems!.items).toHaveLength(2);

		const pastaItem = listWithItems!.items.find(
			(i) => i.ingredientName === "Pasta",
		);
		expect(pastaItem).toBeDefined();
		// Dish appears twice in plan → 200g × 2 = 400g
		expect(pastaItem!.quantity).toBe(400);
		expect(pastaItem!.unit).toBe("g");
	});

	it("skips dishes without recipes", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });

		const planId = await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
		});
		// Dish with no recipe
		const dishId = await asUser.mutation(api.dishes.create, {
			name: "Mystery Dish",
			mealType: "lunch" as const,
			likeness: 3,
			minTimesPerWeek: 1,
			maxTimesPerWeek: 2,
		});
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 0,
			mealType: "lunch" as const,
		});

		const listId = await asUser.mutation(api.shoppingLists.generate, {
			weeklyPlanId: planId,
		});
		const listWithItems = await asUser.query(api.shoppingLists.getWithItems, {
			listId,
		});
		expect(listWithItems!.items).toHaveLength(0);
	});

	it("idempotent: regeneration replaces existing list", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const { planId } = await setupPlanWithRecipe(asUser);

		await asUser.mutation(api.shoppingLists.generate, {
			weeklyPlanId: planId,
		});
		const listId2 = await asUser.mutation(api.shoppingLists.generate, {
			weeklyPlanId: planId,
		});

		// Should still only have one list
		const allLists = await t.run(async (ctx) => {
			return await ctx.db.query("shoppingLists").collect();
		});
		expect(allLists).toHaveLength(1);
		expect(allLists[0]._id).toBe(listId2);
	});

	it("togglePurchased toggles the purchased field", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const { planId } = await setupPlanWithRecipe(asUser);

		const listId = await asUser.mutation(api.shoppingLists.generate, {
			weeklyPlanId: planId,
		});
		const listWithItems = await asUser.query(api.shoppingLists.getWithItems, {
			listId,
		});
		const itemId = listWithItems!.items[0]._id;

		expect(listWithItems!.items[0].purchased).toBe(false);
		await asUser.mutation(api.shoppingLists.togglePurchased, { itemId });

		const updated = await asUser.query(api.shoppingLists.getWithItems, {
			listId,
		});
		expect(updated!.items[0].purchased).toBe(true);
	});

	it("generate throws when unauthenticated", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const { planId } = await setupPlanWithRecipe(asUser);

		await expect(
			t.mutation(api.shoppingLists.generate, { weeklyPlanId: planId }),
		).rejects.toThrow("Not authenticated");
	});
});
