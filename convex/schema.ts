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
		name: v.string(),
		unit: v.string(),
		category: v.optional(v.string()),
		userId: v.string(),
	}).index("by_user", ["userId"]),
	dishes: defineTable({
		name: v.string(),
		mealType: v.union(
			v.literal("breakfast"),
			v.literal("lunch"),
			v.literal("dinner"),
			v.literal("snack"),
		),
		cuisineType: v.optional(v.string()),
		likeness: v.number(),
		minTimesPerWeek: v.number(),
		maxTimesPerWeek: v.number(),
		userId: v.string(),
	}).index("by_user", ["userId"]),
	recipes: defineTable({
		dishId: v.id("dishes"),
		servings: v.number(),
		notes: v.optional(v.string()),
		userId: v.string(),
	})
		.index("by_dish", ["dishId"])
		.index("by_user", ["userId"]),
	recipeIngredients: defineTable({
		recipeId: v.id("recipes"),
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unit: v.string(),
	}).index("by_recipe", ["recipeId"]),
});
