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
	units: defineTable({
		name: v.string(),
		abbreviation: v.string(),
	}).index("by_name", ["name"]),
	ingredients: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		photoStorageId: v.optional(v.string()),
		allowedUnitIds: v.array(v.id("units")),
		primaryUnitId: v.id("units"),
	}).index("by_name", ["name"]),
	recipes: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		authorId: v.string(),
		portions: v.number(),
		cookTimeMinutes: v.number(),
		difficulty: v.union(
			v.literal("easy"),
			v.literal("medium"),
			v.literal("hard"),
		),
		tags: v.array(v.string()),
		coverImageId: v.optional(v.id("_storage")),
		videoUrl: v.optional(v.string()),
		tips: v.array(v.string()),
	}).index("by_author", ["authorId"]),
	recipeIngredients: defineTable({
		recipeId: v.id("recipes"),
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unitOverride: v.optional(v.string()),
		optional: v.optional(v.boolean()),
	}).index("by_recipe", ["recipeId"]),
	recipeSteps: defineTable({
		recipeId: v.id("recipes"),
		order: v.number(),
		text: v.string(),
		imageId: v.optional(v.id("_storage")),
	}).index("by_recipe", ["recipeId"]),
});
