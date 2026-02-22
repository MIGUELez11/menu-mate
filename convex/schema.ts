import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const mealType = v.union(
	v.literal("breakfast"),
	v.literal("lunch"),
	v.literal("dinner"),
);

const planStatus = v.union(v.literal("draft"), v.literal("final"));

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
		normalizedName: v.optional(v.string()),
		defaultUnit: v.optional(v.string()),
		unit: v.optional(v.string()),
	})
		.index("by_user", ["userId"])
		.index("by_user_normalized_name", ["userId", "normalizedName"]),
	recipes: defineTable({
		userId: v.optional(v.string()),
		name: v.optional(v.string()),
		dishId: v.optional(v.string()),
		description: v.optional(v.string()),
		instructions: v.optional(v.string()),
		servings: v.optional(v.number()),
		isActive: v.optional(v.boolean()),
	})
		.index("by_user", ["userId"])
		.index("by_user_name", ["userId", "name"]),
	recipeIngredients: defineTable({
		userId: v.optional(v.string()),
		recipeId: v.id("recipes"),
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unit: v.string(),
		optional: v.optional(v.boolean()),
	})
		.index("by_recipe", ["recipeId"])
		.index("by_ingredient", ["ingredientId"])
		.index("by_user_recipe", ["userId", "recipeId"]),
	recipePreferences: defineTable({
		userId: v.optional(v.string()),
		recipeId: v.id("recipes"),
		likeScore: v.optional(v.number()),
		minPerWeek: v.optional(v.number()),
		targetPerWeek: v.optional(v.number()),
		maxPerWeek: v.optional(v.number()),
		allowConsecutiveDays: v.optional(v.boolean()),
		minGapDays: v.optional(v.number()),
		notes: v.optional(v.string()),
	})
		.index("by_recipe", ["recipeId"])
		.index("by_user_recipe", ["userId", "recipeId"]),
	weeklyPlans: defineTable({
		userId: v.optional(v.string()),
		weekStartDate: v.optional(v.string()),
		status: v.optional(planStatus),
		startDate: v.optional(v.string()),
	})
		.index("by_user_week", ["userId", "weekStartDate"])
		.index("by_user", ["userId"]),
	weeklyPlanItems: defineTable({
		userId: v.optional(v.string()),
		planId: v.optional(v.id("weeklyPlans")),
		date: v.optional(v.string()),
		mealType,
		recipeId: v.optional(v.id("recipes")),
		weeklyPlanId: v.optional(v.id("weeklyPlans")),
		dishId: v.optional(v.string()),
		dayOfWeek: v.optional(v.number()),
	})
		.index("by_plan", ["planId"])
		.index("by_plan_date_meal", ["planId", "date", "mealType"])
		.index("by_recipe", ["recipeId"]),
});
