import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	products: defineTable({
		title: v.string(),
		imageId: v.string(),
		price: v.number(),
	}),
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
	}),
	ingredients: defineTable({
		userId: v.string(),
		name: v.string(),
		normalizedName: v.string(),
		defaultUnit: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_user_normalized_name", ["userId", "normalizedName"]),
	recipes: defineTable({
		userId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		instructions: v.optional(v.string()),
		servings: v.optional(v.number()),
		isActive: v.boolean(),
	})
		.index("by_user", ["userId"])
		.index("by_user_name", ["userId", "name"]),
	recipeIngredients: defineTable({
		userId: v.string(),
		recipeId: v.id("recipes"),
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unit: v.string(),
		optional: v.boolean(),
	})
		.index("by_recipe", ["recipeId"])
		.index("by_ingredient", ["ingredientId"])
		.index("by_user_recipe", ["userId", "recipeId"]),
	recipePreferences: defineTable({
		userId: v.string(),
		recipeId: v.id("recipes"),
		likeScore: v.number(),
		minPerWeek: v.optional(v.number()),
		targetPerWeek: v.optional(v.number()),
		maxPerWeek: v.optional(v.number()),
		allowConsecutiveDays: v.boolean(),
		minGapDays: v.optional(v.number()),
		notes: v.optional(v.string()),
	})
		.index("by_recipe", ["recipeId"])
		.index("by_user_recipe", ["userId", "recipeId"]),
});
