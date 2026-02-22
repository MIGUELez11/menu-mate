import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByDish = query({
	args: { dishId: v.id("dishes") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const recipe = await ctx.db
			.query("recipes")
			.withIndex("by_dish", (q) => q.eq("dishId", args.dishId))
			.first();
		if (!recipe || recipe.userId !== userId) return null;

		const ingredients = await ctx.db
			.query("recipeIngredients")
			.withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
			.collect();

		// Join with ingredient details
		const ingredientsWithDetails = await Promise.all(
			ingredients.map(async (ri) => {
				const ingredient = await ctx.db.get(ri.ingredientId);
				return { ...ri, ingredient };
			}),
		);

		return { ...recipe, ingredients: ingredientsWithDetails };
	},
});

export const createForDish = mutation({
	args: {
		dishId: v.id("dishes"),
		servings: v.number(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const dish = await ctx.db.get(args.dishId);
		if (!dish || dish.userId !== userId) throw new Error("Not found");

		return await ctx.db.insert("recipes", {
			dishId: args.dishId,
			servings: args.servings,
			notes: args.notes,
			userId,
		});
	},
});

export const addIngredient = mutation({
	args: {
		recipeId: v.id("recipes"),
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unit: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const recipe = await ctx.db.get(args.recipeId);
		if (!recipe || recipe.userId !== userId) throw new Error("Not found");

		return await ctx.db.insert("recipeIngredients", {
			recipeId: args.recipeId,
			ingredientId: args.ingredientId,
			quantity: args.quantity,
			unit: args.unit,
		});
	},
});

export const removeIngredient = mutation({
	args: { recipeIngredientId: v.id("recipeIngredients") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const ri = await ctx.db.get(args.recipeIngredientId);
		if (!ri) throw new Error("Not found");

		const recipe = await ctx.db.get(ri.recipeId);
		if (!recipe || recipe.userId !== userId) throw new Error("Not found");

		return await ctx.db.delete(args.recipeIngredientId);
	},
});

export const updateIngredient = mutation({
	args: {
		recipeIngredientId: v.id("recipeIngredients"),
		quantity: v.optional(v.number()),
		unit: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const ri = await ctx.db.get(args.recipeIngredientId);
		if (!ri) throw new Error("Not found");

		const recipe = await ctx.db.get(ri.recipeId);
		if (!recipe || recipe.userId !== userId) throw new Error("Not found");

		const { recipeIngredientId, ...fields } = args;
		return await ctx.db.patch(recipeIngredientId, fields);
	},
});
