import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./lib/auth";
import {
	validatePlanConstraints,
	type ConstraintPreference,
	type PlanItemInput,
} from "./lib/planner";

const mealType = v.union(
	v.literal("breakfast"),
	v.literal("lunch"),
	v.literal("dinner"),
);

function normalizeToWeekStart(dateStr: string) {
	const date = new Date(`${dateStr}T00:00:00.000Z`);
	const day = date.getUTCDay();
	const offset = day === 0 ? -6 : 1 - day;
	date.setUTCDate(date.getUTCDate() + offset);
	return date.toISOString().slice(0, 10);
}

function toDateOnly(dateStr: string) {
	return new Date(`${dateStr}T00:00:00.000Z`).toISOString().slice(0, 10);
}

export const createWeeklyPlan = mutation({
	args: {
		weekStartDate: v.string(),
		status: v.optional(v.union(v.literal("draft"), v.literal("final"))),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const normalizedWeekStart = normalizeToWeekStart(args.weekStartDate);
		const existing = await ctx.db
			.query("weeklyPlans")
			.withIndex("by_user_week", (q) =>
				q.eq("userId", userId).eq("weekStartDate", normalizedWeekStart),
			)
			.unique();

		if (existing) {
			return existing._id;
		}

		return await ctx.db.insert("weeklyPlans", {
			userId,
			weekStartDate: normalizedWeekStart,
			status: args.status ?? "draft",
		});
	},
});

export const listWeeklyPlans = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const plans = await ctx.db
			.query("weeklyPlans")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		return plans.sort((a, b) =>
			(b.weekStartDate ?? "").localeCompare(a.weekStartDate ?? ""),
		);
	},
});

export const getWeeklyPlanWithItems = query({
	args: {
		planId: v.id("weeklyPlans"),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const plan = await ctx.db.get(args.planId);
		if (!plan || plan.userId !== userId) {
			throw new Error("Weekly plan not found");
		}

		const items = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan", (q) => q.eq("planId", args.planId))
			.collect();
		const validItems = items.filter(
			(
				item,
			): item is typeof item & {
				recipeId: typeof item.recipeId & string;
				date: string;
			} => typeof item.date === "string" && typeof item.recipeId === "string",
		);

		const recipeIds = Array.from(new Set(validItems.map((item) => item.recipeId)));
		const recipes = await Promise.all(recipeIds.map((recipeId) => ctx.db.get(recipeId)));
		const recipeNameById = new Map(
			recipes
				.filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== null)
				.filter(
					(
						recipe,
					): recipe is typeof recipe & {
						name: string;
					} => typeof recipe.name === "string",
				)
				.map((recipe) => [recipe._id, recipe.name]),
		);

		const sortedItems = validItems
			.sort((a, b) => {
				if (a.date !== b.date) {
					return a.date.localeCompare(b.date);
				}
				return a.mealType.localeCompare(b.mealType);
			})
			.map((item) => ({
				...item,
				recipeName: recipeNameById.get(item.recipeId) ?? "Unknown",
			}));

		return {
			...plan,
			items: sortedItems,
		};
	},
});

export const upsertWeeklyPlanItem = mutation({
	args: {
		planId: v.id("weeklyPlans"),
		date: v.string(),
		mealType,
		recipeId: v.id("recipes"),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const normalizedDate = toDateOnly(args.date);
		const plan = await ctx.db.get(args.planId);
		if (!plan || plan.userId !== userId) {
			throw new Error("Weekly plan not found");
		}

		const recipe = await ctx.db.get(args.recipeId);
		if (
			!recipe ||
			recipe.userId !== userId ||
			recipe.isActive === false ||
			typeof recipe.name !== "string" ||
			recipe.name.trim().length === 0
		) {
			throw new Error("Recipe not found");
		}

		const existing = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan_date_meal", (q) =>
				q
					.eq("planId", args.planId)
					.eq("date", normalizedDate)
					.eq("mealType", args.mealType),
			)
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				recipeId: args.recipeId,
			});
			return existing._id;
		}

		return await ctx.db.insert("weeklyPlanItems", {
			userId,
			planId: args.planId,
			date: normalizedDate,
			mealType: args.mealType,
			recipeId: args.recipeId,
		});
	},
});

export const removeWeeklyPlanItem = mutation({
	args: {
		itemId: v.id("weeklyPlanItems"),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const item = await ctx.db.get(args.itemId);
		if (!item || item.userId !== userId) {
			throw new Error("Plan item not found");
		}
		await ctx.db.delete(args.itemId);
	},
});

export const validateWeeklyPlanConstraints = query({
	args: {
		planId: v.id("weeklyPlans"),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const plan = await ctx.db.get(args.planId);
		if (!plan || plan.userId !== userId) {
			throw new Error("Weekly plan not found");
		}

		const items = await ctx.db
			.query("weeklyPlanItems")
			.withIndex("by_plan", (q) => q.eq("planId", args.planId))
			.collect();
		const validItems = items.filter(
			(
				item,
			): item is typeof item & {
				recipeId: typeof item.recipeId & string;
				date: string;
			} => typeof item.date === "string" && typeof item.recipeId === "string",
		);
		const recipes = await ctx.db
			.query("recipes")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const prefRows = await ctx.db
			.query("recipePreferences")
			.withIndex("by_user_recipe", (q) => q.eq("userId", userId))
			.collect();

		const recipeNameById = new Map(
			recipes
				.filter(
					(recipe): recipe is typeof recipe & { name: string } =>
						typeof recipe.name === "string" && recipe.name.trim().length > 0,
				)
				.map((recipe) => [recipe._id, recipe.name]),
		);
		const preferences: ConstraintPreference[] = prefRows.map((row) => ({
			recipeId: row.recipeId,
			name: recipeNameById.get(row.recipeId) ?? "Unknown recipe",
			likeScore: row.likeScore ?? 3,
			minPerWeek: row.minPerWeek,
			targetPerWeek: row.targetPerWeek,
			maxPerWeek: row.maxPerWeek,
			allowConsecutiveDays: row.allowConsecutiveDays ?? true,
			minGapDays: row.minGapDays,
		}));

		const planItems: PlanItemInput[] = validItems.map((item) => ({
			recipeId: item.recipeId,
			date: item.date,
			mealType: item.mealType,
		}));

		return validatePlanConstraints(planItems, preferences);
	},
});
