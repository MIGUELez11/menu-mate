import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";
import { computeShoppingDeficits, type IngredientNeedInput } from "./lib/shopping";

export const getShoppingListForPlan = query({
	args: {
		planId: v.id("weeklyPlans"),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const plan = await ctx.db.get(args.planId);
		if (!plan || plan.userId !== userId) {
			throw new Error("Weekly plan not found");
		}

		const planItems = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan", (q) => q.eq("planId", args.planId))
			.collect();
		const recipeIds = Array.from(new Set(planItems.map((item) => item.recipeId)));
		const recipeIngredients = (
			await Promise.all(
				recipeIds.map((recipeId) =>
					ctx.db.query("recipeIngredients").withIndex("by_recipe", (q) => q.eq("recipeId", recipeId)).collect(),
				),
			)
		).flat();

		const ingredientIds = Array.from(
			new Set(recipeIngredients.map((ingredient) => ingredient.ingredientId)),
		);
		const ingredientRows = await Promise.all(
			ingredientIds.map((ingredientId) => ctx.db.get(ingredientId)),
		);
		const ingredientNameById = new Map(
			ingredientRows
				.filter((ingredient): ingredient is NonNullable<typeof ingredient> => ingredient !== null)
				.map((ingredient) => [ingredient._id, ingredient.name]),
		);

		const planRecipeCount: Record<string, number> = {};
		for (const item of planItems) {
			planRecipeCount[item.recipeId] = (planRecipeCount[item.recipeId] ?? 0) + 1;
		}

		const needs: IngredientNeedInput[] = recipeIngredients.map((entry) => {
			const timesUsed = planRecipeCount[entry.recipeId] ?? 1;
			return {
				ingredientId: entry.ingredientId,
				ingredientName: ingredientNameById.get(entry.ingredientId) ?? "Unknown",
				quantity: entry.quantity * timesUsed,
				unit: entry.unit,
			};
		});

		const pantryItems = await ctx.db
			.query("pantryItems")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		return computeShoppingDeficits(needs, pantryItems);
	},
});
