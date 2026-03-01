import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		name: v.string(),
		abbreviation: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("units", {
			name: args.name,
			abbreviation: args.abbreviation,
		});
	},
});

export const getById = query({
	args: { id: v.id("units") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const list = query({
	args: { search: v.optional(v.string()) },
	handler: async (ctx, args) => {
		if (args.search) {
			const term = args.search.toLowerCase();
			const all = await ctx.db.query("units").collect();
			return all.filter((u) => u.name.toLowerCase().includes(term));
		}
		return await ctx.db.query("units").collect();
	},
});

export const update = mutation({
	args: {
		id: v.id("units"),
		name: v.string(),
		abbreviation: v.string(),
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args;
		await ctx.db.patch(id, fields);
	},
});

export const deleteUnit = mutation({
	args: { id: v.id("units") },
	handler: async (ctx, args) => {
		const usedBy = await ctx.db
			.query("ingredients")
			.filter((q) => q.eq(q.field("primaryUnitId"), args.id))
			.first();
		if (!usedBy) {
			const usedInAllowed = await ctx.db
				.query("ingredients")
				.collect()
				.then((all) => all.filter((i) => i.allowedUnitIds.includes(args.id)));
			if (usedInAllowed.length > 0) {
				throw new Error(
					`Cannot delete unit: ${usedInAllowed.length} ingredient(s) use this unit.`,
				);
			}
		} else {
			const count = await ctx.db
				.query("ingredients")
				.collect()
				.then(
					(all) => all.filter((i) => i.allowedUnitIds.includes(args.id)).length,
				);
			throw new Error(
				`Cannot delete unit: ${count} ingredient(s) use this unit.`,
			);
		}
		await ctx.db.delete(args.id);
	},
});
