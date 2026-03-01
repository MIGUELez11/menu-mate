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
});
