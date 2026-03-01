import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		photoStorageId: v.optional(v.string()),
		allowedUnitIds: v.array(v.id("units")),
		primaryUnitId: v.id("units"),
	},
	handler: async (ctx, args) => {
		if (!args.allowedUnitIds.includes(args.primaryUnitId)) {
			throw new Error("primaryUnitId must be one of allowedUnitIds");
		}
		return await ctx.db.insert("ingredients", {
			name: args.name,
			description: args.description,
			photoStorageId: args.photoStorageId,
			allowedUnitIds: args.allowedUnitIds,
			primaryUnitId: args.primaryUnitId,
		});
	},
});

export const getById = query({
	args: { id: v.id("ingredients") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const list = query({
	args: { search: v.optional(v.string()) },
	handler: async (ctx, args) => {
		if (args.search) {
			const term = args.search.toLowerCase();
			const all = await ctx.db.query("ingredients").collect();
			return all.filter((i) => i.name.toLowerCase().includes(term));
		}
		return await ctx.db.query("ingredients").collect();
	},
});

export const update = mutation({
	args: {
		id: v.id("ingredients"),
		name: v.string(),
		description: v.optional(v.string()),
		photoStorageId: v.optional(v.string()),
		allowedUnitIds: v.array(v.id("units")),
		primaryUnitId: v.id("units"),
	},
	handler: async (ctx, args) => {
		if (!args.allowedUnitIds.includes(args.primaryUnitId)) {
			throw new Error("primaryUnitId must be one of allowedUnitIds");
		}
		const { id, ...fields } = args;
		await ctx.db.patch(id, fields);
	},
});

export const deleteIngredient = mutation({
	args: { id: v.id("ingredients") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});
