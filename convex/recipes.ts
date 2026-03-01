import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		return ctx.storage.generateUploadUrl();
	},
});

const recipeFields = {
	name: v.string(),
	description: v.optional(v.string()),
	portions: v.number(),
	cookTimeMinutes: v.number(),
	difficulty: v.union(
		v.literal("easy"),
		v.literal("medium"),
		v.literal("hard"),
	),
	tags: v.array(v.string()),
	coverImageId: v.optional(v.union(v.id("_storage"), v.null())),
	videoUrl: v.optional(v.string()),
	tips: v.array(v.string()),
};

export const create = mutation({
	args: recipeFields,
	handler: async (ctx, { coverImageId, ...rest }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		return ctx.db.insert("recipes", {
			...rest,
			authorId: identity.subject,
			...(coverImageId ? { coverImageId } : {}),
		});
	},
});

export const list = query({
	args: { tag: v.optional(v.string()), search: v.optional(v.string()) },
	handler: async (ctx, { tag, search }) => {
		const recipes = await ctx.db.query("recipes").collect();
		let filtered = tag ? recipes.filter((r) => r.tags.includes(tag)) : recipes;
		if (search) {
			const lower = search.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.name.toLowerCase().includes(lower) ||
					(r.description?.toLowerCase().includes(lower) ?? false),
			);
		}
		return Promise.all(
			filtered.map(async (r) => ({
				...r,
				coverImageUrl: r.coverImageId
					? await ctx.storage.getUrl(r.coverImageId)
					: null,
			})),
		);
	},
});

export const getById = query({
	args: { id: v.id("recipes") },
	handler: async (ctx, { id }) => {
		const recipe = await ctx.db.get(id);
		if (!recipe) return null;
		const coverImageUrl = recipe.coverImageId
			? await ctx.storage.getUrl(recipe.coverImageId)
			: null;
		const ingredients = await ctx.db
			.query("recipeIngredients")
			.withIndex("by_recipe", (q) => q.eq("recipeId", id))
			.collect();
		const enrichedIngredients = await Promise.all(
			ingredients.map(async (ri) => {
				const ingredient = await ctx.db.get(ri.ingredientId);
				return { ...ri, ingredientName: ingredient?.name ?? "" };
			}),
		);
		const steps = await ctx.db
			.query("recipeSteps")
			.withIndex("by_recipe", (q) => q.eq("recipeId", id))
			.order("asc")
			.collect();
		const sortedSteps = steps.sort((a, b) => a.order - b.order);
		const enrichedSteps = await Promise.all(
			sortedSteps.map(async (step) => {
				const imageUrl = step.imageId
					? await ctx.storage.getUrl(step.imageId)
					: null;
				return { ...step, imageUrl };
			}),
		);
		return {
			...recipe,
			coverImageUrl,
			ingredients: enrichedIngredients,
			steps: enrichedSteps,
		};
	},
});

export const update = mutation({
	args: { id: v.id("recipes"), ...recipeFields },
	handler: async (ctx, { id, coverImageId, ...rest }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const recipe = await ctx.db.get(id);
		if (!recipe || recipe.authorId !== identity.subject)
			throw new Error("Not authorized");
		// coverImageId: null = clear, id = set, undefined = no change
		const coverPatch =
			coverImageId !== undefined
				? { coverImageId: coverImageId === null ? undefined : coverImageId }
				: {};
		await ctx.db.patch(id, { ...rest, ...coverPatch });
	},
});

export const remove = mutation({
	args: { id: v.id("recipes") },
	handler: async (ctx, { id }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const recipe = await ctx.db.get(id);
		if (!recipe || recipe.authorId !== identity.subject)
			throw new Error("Not authorized");
		// cascade delete ingredients and steps
		const ingredients = await ctx.db
			.query("recipeIngredients")
			.withIndex("by_recipe", (q) => q.eq("recipeId", id))
			.collect();
		for (const ri of ingredients) await ctx.db.delete(ri._id);
		const steps = await ctx.db
			.query("recipeSteps")
			.withIndex("by_recipe", (q) => q.eq("recipeId", id))
			.collect();
		for (const s of steps) await ctx.db.delete(s._id);
		await ctx.db.delete(id);
	},
});

export const addIngredient = mutation({
	args: {
		recipeId: v.id("recipes"),
		ingredientId: v.id("ingredients"),
		quantity: v.number(),
		unitOverride: v.optional(v.string()),
		optional: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		return ctx.db.insert("recipeIngredients", args);
	},
});

export const updateIngredient = mutation({
	args: {
		id: v.id("recipeIngredients"),
		quantity: v.number(),
		unitOverride: v.optional(v.string()),
		optional: v.optional(v.boolean()),
	},
	handler: async (ctx, { id, ...fields }) => {
		await ctx.db.patch(id, fields);
	},
});

export const removeIngredient = mutation({
	args: { id: v.id("recipeIngredients") },
	handler: async (ctx, { id }) => {
		await ctx.db.delete(id);
	},
});

export const addStep = mutation({
	args: {
		recipeId: v.id("recipes"),
		text: v.string(),
		imageId: v.optional(v.union(v.id("_storage"), v.null())),
	},
	handler: async (ctx, { imageId, ...rest }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");
		const existing = await ctx.db
			.query("recipeSteps")
			.withIndex("by_recipe", (q) => q.eq("recipeId", rest.recipeId))
			.collect();
		const order = existing.length + 1;
		return ctx.db.insert("recipeSteps", {
			...rest,
			order,
			...(imageId ? { imageId } : {}),
		});
	},
});

export const updateStep = mutation({
	args: {
		id: v.id("recipeSteps"),
		text: v.string(),
		imageId: v.optional(v.union(v.id("_storage"), v.null())),
	},
	handler: async (ctx, { id, imageId, text }) => {
		// imageId: null = clear, id = set, undefined = no change
		const imagePatch =
			imageId !== undefined
				? { imageId: imageId === null ? undefined : imageId }
				: {};
		await ctx.db.patch(id, { text, ...imagePatch });
	},
});

export const removeStep = mutation({
	args: { id: v.id("recipeSteps") },
	handler: async (ctx, { id }) => {
		await ctx.db.delete(id);
	},
});

export const reorderSteps = mutation({
	args: {
		recipeId: v.id("recipes"),
		stepIds: v.array(v.id("recipeSteps")),
	},
	handler: async (ctx, { stepIds }) => {
		for (let i = 0; i < stepIds.length; i++) {
			await ctx.db.patch(stepIds[i], { order: i + 1 });
		}
	},
});
