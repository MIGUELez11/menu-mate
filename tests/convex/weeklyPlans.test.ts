import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.*s", { eager: false });

describe("weeklyPlans", () => {
	async function createDish(asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>) {
		return asUser.mutation(api.dishes.create, {
			name: "Pasta",
			mealType: "dinner" as const,
			likeness: 4,
			minTimesPerWeek: 1,
			maxTimesPerWeek: 3,
		});
	}

	it("list returns empty for new user", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		expect(await asUser.query(api.weeklyPlans.list)).toEqual([]);
	});

	it("create and list plan", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
			name: "Week 1",
		});
		const list = await asUser.query(api.weeklyPlans.list);
		expect(list).toHaveLength(1);
		expect(list[0].name).toBe("Week 1");
		expect(list[0].itemCount).toBe(0);
	});

	it("addItem and getWithItems join", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const planId = await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
		});
		const dishId = await createDish(asUser);
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 0,
			mealType: "dinner" as const,
		});

		const planWithItems = await asUser.query(api.weeklyPlans.getWithItems, {
			id: planId,
		});
		expect(planWithItems).not.toBeNull();
		expect(planWithItems!.items).toHaveLength(1);
		expect(planWithItems!.items[0].dish!.name).toBe("Pasta");
	});

	it("removeItem removes item", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const planId = await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
		});
		const dishId = await createDish(asUser);
		const itemId = await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 1,
			mealType: "lunch" as const,
		});
		await asUser.mutation(api.weeklyPlans.removeItem, { itemId });
		const planWithItems = await asUser.query(api.weeklyPlans.getWithItems, {
			id: planId,
		});
		expect(planWithItems!.items).toHaveLength(0);
	});

	it("cascade delete removes items", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const planId = await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
		});
		const dishId = await createDish(asUser);
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 0,
			mealType: "dinner" as const,
		});
		await asUser.mutation(api.weeklyPlans.remove, { id: planId });

		const remainingItems = await t.run(async (ctx) => {
			return await ctx.db.query("weeklyPlanItems").collect();
		});
		expect(remainingItems).toHaveLength(0);
	});

	it("list only returns plans for authenticated user", async () => {
		const t = convexTest(schema, modules);
		const asUser1 = t.withIdentity({ subject: "user1" });
		const asUser2 = t.withIdentity({ subject: "user2" });
		await asUser1.mutation(api.weeklyPlans.create, { weekStartDate: "2026-02-17" });
		expect(await asUser2.query(api.weeklyPlans.list)).toHaveLength(0);
	});

	it("create throws when unauthenticated", async () => {
		const t = convexTest(schema, modules);
		await expect(
			t.mutation(api.weeklyPlans.create, { weekStartDate: "2026-02-17" }),
		).rejects.toThrow("Not authenticated");
	});

	it("list includes itemCount", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const planId = await asUser.mutation(api.weeklyPlans.create, {
			weekStartDate: "2026-02-17",
		});
		const dishId = await createDish(asUser);
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 2,
			mealType: "breakfast" as const,
		});
		await asUser.mutation(api.weeklyPlans.addItem, {
			weeklyPlanId: planId,
			dishId,
			dayOfWeek: 3,
			mealType: "lunch" as const,
		});
		const list = await asUser.query(api.weeklyPlans.list);
		expect(list[0].itemCount).toBe(2);
	});
});
