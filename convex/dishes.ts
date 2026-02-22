import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const mealTypeValidator = v.union(
	v.literal("breakfast"),
	v.literal("lunch"),
	v.literal("dinner"),
	v.literal("snack"),
);

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		return await ctx.db
			.query("dishes")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
	},
});

export const get = query({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		const dish = await ctx.db.get(args.id);
		if (!dish || dish.userId !== userId) return null;
		return dish;
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		mealType: mealTypeValidator,
		cuisineType: v.optional(v.string()),
		likeness: v.number(),
		minTimesPerWeek: v.number(),
		maxTimesPerWeek: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		return await ctx.db.insert("dishes", { ...args, userId });
	},
});

export const update = mutation({
	args: {
		id: v.id("dishes"),
		name: v.optional(v.string()),
		mealType: v.optional(mealTypeValidator),
		cuisineType: v.optional(v.string()),
		likeness: v.optional(v.number()),
		minTimesPerWeek: v.optional(v.number()),
		maxTimesPerWeek: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		const { id, ...fields } = args;
		const dish = await ctx.db.get(id);
		if (!dish || dish.userId !== userId) throw new Error("Not found");
		return await ctx.db.patch(id, fields);
	},
});

export const remove = mutation({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		const dish = await ctx.db.get(args.id);
		if (!dish || dish.userId !== userId) throw new Error("Not found");

		// Cascade: delete recipe and its ingredients
		const recipes = await ctx.db
			.query("recipes")
			.withIndex("by_dish", (q) => q.eq("dishId", args.id))
			.collect();
		for (const recipe of recipes) {
			const recipeIngredients = await ctx.db
				.query("recipeIngredients")
				.withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
				.collect();
			for (const ri of recipeIngredients) {
				await ctx.db.delete(ri._id);
			}
			await ctx.db.delete(recipe._id);
		}

		return await ctx.db.delete(args.id);
	},
});
