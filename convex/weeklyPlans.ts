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
		const plans = await ctx.db
			.query("weeklyPlans")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		// Attach item count
		return await Promise.all(
			plans.map(async (plan) => {
				const items = await ctx.db
					.query("weeklyPlanItems")
					.withIndex("by_plan", (q) => q.eq("weeklyPlanId", plan._id))
					.collect();
				return { ...plan, itemCount: items.length };
			}),
		);
	},
});

export const getWithItems = query({
	args: { id: v.id("weeklyPlans") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const plan = await ctx.db.get(args.id);
		if (!plan || plan.userId !== userId) return null;

		const items = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan", (q) => q.eq("weeklyPlanId", args.id))
			.collect();

		const itemsWithDish = await Promise.all(
			items.map(async (item) => {
				const dish = await ctx.db.get(item.dishId);
				return { ...item, dish };
			}),
		);

		return { ...plan, items: itemsWithDish };
	},
});

export const create = mutation({
	args: {
		weekStartDate: v.string(),
		name: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		return await ctx.db.insert("weeklyPlans", {
			userId,
			weekStartDate: args.weekStartDate,
			name: args.name,
		});
	},
});

export const remove = mutation({
	args: { id: v.id("weeklyPlans") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const plan = await ctx.db.get(args.id);
		if (!plan || plan.userId !== userId) throw new Error("Not found");

		// Cascade delete items
		const items = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan", (q) => q.eq("weeklyPlanId", args.id))
			.collect();
		for (const item of items) {
			await ctx.db.delete(item._id);
		}

		return await ctx.db.delete(args.id);
	},
});

export const addItem = mutation({
	args: {
		weeklyPlanId: v.id("weeklyPlans"),
		dishId: v.id("dishes"),
		dayOfWeek: v.number(),
		mealType: mealTypeValidator,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const plan = await ctx.db.get(args.weeklyPlanId);
		if (!plan || plan.userId !== userId) throw new Error("Not found");

		return await ctx.db.insert("weeklyPlanItems", {
			weeklyPlanId: args.weeklyPlanId,
			dishId: args.dishId,
			dayOfWeek: args.dayOfWeek,
			mealType: args.mealType,
		});
	},
});

export const removeItem = mutation({
	args: { itemId: v.id("weeklyPlanItems") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;

		const item = await ctx.db.get(args.itemId);
		if (!item) throw new Error("Not found");

		const plan = await ctx.db.get(item.weeklyPlanId);
		if (!plan || plan.userId !== userId) throw new Error("Not found");

		return await ctx.db.delete(args.itemId);
	},
});
