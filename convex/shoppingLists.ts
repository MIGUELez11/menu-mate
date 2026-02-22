import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByPlan = query({
	args: { weeklyPlanId: v.id("weeklyPlans") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const list = await ctx.db
			.query("shoppingLists")
			.withIndex("by_plan", (q) => q.eq("weeklyPlanId", args.weeklyPlanId))
			.first();
		if (!list || list.userId !== userId) return null;
		return list;
	},
});

export const getWithItems = query({
	args: { listId: v.id("shoppingLists") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const list = await ctx.db.get(args.listId);
		if (!list || list.userId !== userId) return null;

		const items = await ctx.db
			.query("shoppingListItems")
			.withIndex("by_list", (q) => q.eq("shoppingListId", args.listId))
			.collect();

		return { ...list, items };
	},
});

export const generate = mutation({
	args: { weeklyPlanId: v.id("weeklyPlans") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const plan = await ctx.db.get(args.weeklyPlanId);
		if (!plan || plan.userId !== userId) throw new Error("Not found");

		// Idempotent: delete existing list for this plan
		const existing = await ctx.db
			.query("shoppingLists")
			.withIndex("by_plan", (q) => q.eq("weeklyPlanId", args.weeklyPlanId))
			.first();
		if (existing) {
			const existingItems = await ctx.db
				.query("shoppingListItems")
				.withIndex("by_list", (q) => q.eq("shoppingListId", existing._id))
				.collect();
			for (const item of existingItems) {
				await ctx.db.delete(item._id);
			}
			await ctx.db.delete(existing._id);
		}

		// Get plan items
		const planItems = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan", (q) => q.eq("weeklyPlanId", args.weeklyPlanId))
			.collect();

		// Aggregate ingredients: key = `${ingredientId}|${unit}`
		const aggregated = new Map<
			string,
			{
				ingredientId: string;
				ingredientName: string;
				category: string | undefined;
				quantity: number;
				unit: string;
			}
		>();

		for (const planItem of planItems) {
			const dish = await ctx.db.get(planItem.dishId);
			if (!dish) continue;

			const recipe = await ctx.db
				.query("recipes")
				.withIndex("by_dish", (q) => q.eq("dishId", planItem.dishId))
				.first();
			if (!recipe) continue; // skip dishes without recipes

			const recipeIngredients = await ctx.db
				.query("recipeIngredients")
				.withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
				.collect();

			for (const ri of recipeIngredients) {
				const ingredient = await ctx.db.get(ri.ingredientId);
				if (!ingredient) continue;

				const key = `${ri.ingredientId}|${ri.unit}`;
				const existing = aggregated.get(key);
				if (existing) {
					existing.quantity += ri.quantity;
				} else {
					aggregated.set(key, {
						ingredientId: ri.ingredientId,
						ingredientName: ingredient.name,
						category: ingredient.category,
						quantity: ri.quantity,
						unit: ri.unit,
					});
				}
			}
		}

		// Create new list
		const listId = await ctx.db.insert("shoppingLists", {
			weeklyPlanId: args.weeklyPlanId,
			userId,
		});

		// Insert items
		for (const entry of aggregated.values()) {
			await ctx.db.insert("shoppingListItems", {
				shoppingListId: listId,
				ingredientId: entry.ingredientId as never,
				ingredientName: entry.ingredientName,
				category: entry.category,
				quantity: entry.quantity,
				unit: entry.unit,
				purchased: false,
			});
		}

		return listId;
	},
});

export const togglePurchased = mutation({
	args: { itemId: v.id("shoppingListItems") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const item = await ctx.db.get(args.itemId);
		if (!item) throw new Error("Not found");

		const list = await ctx.db.get(item.shoppingListId);
		if (!list || list.userId !== userId) throw new Error("Not found");

		return await ctx.db.patch(args.itemId, { purchased: !item.purchased });
	},
});

export const deleteList = mutation({
	args: { listId: v.id("shoppingLists") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const list = await ctx.db.get(args.listId);
		if (!list || list.userId !== userId) throw new Error("Not found");

		const items = await ctx.db
			.query("shoppingListItems")
			.withIndex("by_list", (q) => q.eq("shoppingListId", args.listId))
			.collect();
		for (const item of items) {
			await ctx.db.delete(item._id);
		}

		return await ctx.db.delete(args.listId);
	},
});
