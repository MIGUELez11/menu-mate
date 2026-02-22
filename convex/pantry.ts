import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

const location = v.union(
	v.literal("pantry"),
	v.literal("fridge"),
	v.literal("freezer"),
);

export const listPantryItems = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const rows = await ctx.db
			.query("pantryItems")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const ingredients = await Promise.all(rows.map((row) => ctx.db.get(row.ingredientId)));

		return rows
			.map((row, index) => ({
				...row,
				ingredientName: ingredients[index]?.name ?? "Unknown",
			}))
			.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
	},
});

export const upsertPantryItem = mutation({
	args: {
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unit: v.string(),
		location,
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const ingredient = await ctx.db.get(args.ingredientId);
		if (!ingredient || ingredient.userId !== userId) {
			throw new Error("Ingredient not found");
		}

		const existing = await ctx.db
			.query("pantryItems")
			.withIndex("by_user_ingredient_unit", (q) =>
				q.eq("userId", userId).eq("ingredientId", args.ingredientId).eq("unit", args.unit),
			)
			.unique();

		if (args.quantity <= 0) {
			if (existing) {
				await ctx.db.delete(existing._id);
			}
			return null;
		}

		if (existing) {
			await ctx.db.patch(existing._id, {
				quantity: args.quantity,
				location: args.location,
			});
			return existing._id;
		}

		return await ctx.db.insert("pantryItems", {
			userId,
			ingredientId: args.ingredientId,
			quantity: args.quantity,
			unit: args.unit,
			location: args.location,
		});
	},
});

export const removePantryItem = mutation({
	args: { pantryItemId: v.id("pantryItems") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const pantryItem = await ctx.db.get(args.pantryItemId);
		if (!pantryItem || pantryItem.userId !== userId) {
			throw new Error("Pantry item not found");
		}
		await ctx.db.delete(args.pantryItemId);
	},
});
