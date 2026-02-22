import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		return await ctx.db
			.query("ingredients")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		unit: v.string(),
		category: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		return await ctx.db.insert("ingredients", {
			name: args.name,
			unit: args.unit,
			category: args.category,
			userId,
		});
	},
});

export const remove = mutation({
	args: { id: v.id("ingredients") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const userId = identity.subject;
		const ingredient = await ctx.db.get(args.id);
		if (!ingredient || ingredient.userId !== userId) {
			throw new Error("Not found");
		}
		return await ctx.db.delete(args.id);
	},
});
