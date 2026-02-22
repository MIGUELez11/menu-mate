import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";

function normalizeName(name: string) {
	return name.trim().toLowerCase();
}

const recipePayload = {
	name: v.string(),
	description: v.optional(v.string()),
	instructions: v.optional(v.string()),
	servings: v.optional(v.number()),
};

export const listRecipes = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const recipes = await ctx.db
			.query("recipes")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const active = recipes.filter(
			(recipe): recipe is typeof recipe & { name: string } =>
				recipe.isActive !== false &&
				typeof recipe.name === "string" &&
				recipe.name.trim().length > 0,
		);

		const preferences = await Promise.all(
			active.map((recipe) =>
				ctx.db
					.query("recipePreferences")
					.withIndex("by_user_recipe", (q) =>
						q.eq("userId", userId).eq("recipeId", recipe._id),
					)
					.unique(),
			),
		);

		return active
			.map((recipe, index) => ({
				...recipe,
				preference: preferences[index],
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	},
});

export const getRecipe = query({
	args: { recipeId: v.id("recipes") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const recipe = await ctx.db.get(args.recipeId);
		if (
			!recipe ||
			recipe.userId !== userId ||
			recipe.isActive === false ||
			typeof recipe.name !== "string" ||
			recipe.name.trim().length === 0
		) {
			throw new Error("Recipe not found");
		}

		const recipeIngredients = await ctx.db
			.query("recipeIngredients")
			.withIndex("by_user_recipe", (q) =>
				q.eq("userId", userId).eq("recipeId", recipe._id),
			)
			.collect();

		const ingredients = await Promise.all(
			recipeIngredients.map((entry) => ctx.db.get(entry.ingredientId)),
		);

		const preference = await ctx.db
			.query("recipePreferences")
			.withIndex("by_user_recipe", (q) =>
				q.eq("userId", userId).eq("recipeId", recipe._id),
			)
			.unique();

		return {
			...recipe,
			ingredients: recipeIngredients
				.map((entry, index) => ({
					...entry,
					optional: entry.optional ?? false,
					ingredientName: ingredients[index]?.name ?? "Unknown",
				}))
				.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
			preference,
		};
	},
});

export const createRecipe = mutation({
	args: recipePayload,
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const name = args.name.trim();
		if (name.length === 0) {
			throw new Error("Recipe name is required");
		}

		return await ctx.db.insert("recipes", {
			userId,
			name,
			description: args.description?.trim() || undefined,
			instructions: args.instructions?.trim() || undefined,
			servings: args.servings,
			isActive: true,
		});
	},
});

export const updateRecipe = mutation({
	args: {
		recipeId: v.id("recipes"),
		...recipePayload,
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const recipe = await ctx.db.get(args.recipeId);
		if (!recipe || recipe.userId !== userId || recipe.isActive === false) {
			throw new Error("Recipe not found");
		}

		const name = args.name.trim();
		if (name.length === 0) {
			throw new Error("Recipe name is required");
		}

		await ctx.db.patch(args.recipeId, {
			name,
			description: args.description?.trim() || undefined,
			instructions: args.instructions?.trim() || undefined,
			servings: args.servings,
		});
	},
});

export const deleteRecipe = mutation({
	args: { recipeId: v.id("recipes") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const recipe = await ctx.db.get(args.recipeId);
		if (!recipe || recipe.userId !== userId || recipe.isActive === false) {
			throw new Error("Recipe not found");
		}
		await ctx.db.patch(args.recipeId, { isActive: false });
	},
});

export const upsertRecipeIngredients = mutation({
	args: {
		recipeId: v.id("recipes"),
		ingredients: v.array(
			v.object({
				name: v.string(),
				quantity: v.number(),
				unit: v.string(),
				optional: v.boolean(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const recipe = await ctx.db.get(args.recipeId);
		if (!recipe || recipe.userId !== userId || recipe.isActive === false) {
			throw new Error("Recipe not found");
		}

		const existing = await ctx.db
			.query("recipeIngredients")
			.withIndex("by_user_recipe", (q) =>
				q.eq("userId", userId).eq("recipeId", args.recipeId),
			)
			.collect();
		for (const row of existing) {
			await ctx.db.delete(row._id);
		}

		for (const entry of args.ingredients) {
			const name = entry.name.trim();
			if (!name) {
				continue;
			}
			const normalizedName = normalizeName(name);
			let ingredient = await ctx.db
				.query("ingredients")
				.withIndex("by_user_normalized_name", (q) =>
					q.eq("userId", userId).eq("normalizedName", normalizedName),
				)
				.unique();

			if (!ingredient) {
				const ingredientId = await ctx.db.insert("ingredients", {
					userId,
					name,
					normalizedName,
					defaultUnit: entry.unit.trim() || "unit",
					unit: entry.unit.trim() || "unit",
				});
				ingredient = await ctx.db.get(ingredientId);
			}

			if (!ingredient) {
				continue;
			}

			await ctx.db.insert("recipeIngredients", {
				userId,
				recipeId: args.recipeId,
				ingredientId: ingredient._id,
				quantity: entry.quantity,
				unit: entry.unit.trim() || ingredient.defaultUnit || ingredient.unit || "unit",
				optional: entry.optional,
			});
		}
	},
});

export const upsertRecipePreferences = mutation({
	args: {
		recipeId: v.id("recipes"),
		likeScore: v.number(),
		minPerWeek: v.optional(v.number()),
		targetPerWeek: v.optional(v.number()),
		maxPerWeek: v.optional(v.number()),
		allowConsecutiveDays: v.boolean(),
		minGapDays: v.optional(v.number()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const recipe = await ctx.db.get(args.recipeId);
		if (!recipe || recipe.userId !== userId || recipe.isActive === false) {
			throw new Error("Recipe not found");
		}

		if (args.likeScore < 1 || args.likeScore > 5) {
			throw new Error("likeScore must be between 1 and 5");
		}

		if (
			args.minPerWeek !== undefined &&
			args.maxPerWeek !== undefined &&
			args.minPerWeek > args.maxPerWeek
		) {
			throw new Error("minPerWeek cannot be greater than maxPerWeek");
		}

		const existing = await ctx.db
			.query("recipePreferences")
			.withIndex("by_user_recipe", (q) =>
				q.eq("userId", userId).eq("recipeId", args.recipeId),
			)
			.unique();

		const patch = {
			userId,
			recipeId: args.recipeId,
			likeScore: args.likeScore,
			minPerWeek: args.minPerWeek,
			targetPerWeek: args.targetPerWeek,
			maxPerWeek: args.maxPerWeek,
			allowConsecutiveDays: args.allowConsecutiveDays,
			minGapDays: args.minGapDays,
			notes: args.notes?.trim() || undefined,
		};

		if (existing) {
			await ctx.db.patch(existing._id, patch);
			return existing._id;
		}

		return await ctx.db.insert("recipePreferences", patch);
	},
});

export const listIngredients = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const ingredients = await ctx.db
			.query("ingredients")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		return ingredients.sort((a, b) => a.name.localeCompare(b.name));
	},
});
