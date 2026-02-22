import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s", { eager: false });

describe("ingredients", () => {
	it("list returns empty for new user", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const result = await asUser.query(api.ingredients.list);
		expect(result).toEqual([]);
	});

	it("create and list ingredients", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		await asUser.mutation(api.ingredients.create, {
			name: "Tomato",
			unit: "kg",
			category: "vegetables",
		});
		const result = await asUser.query(api.ingredients.list);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Tomato");
		expect(result[0].unit).toBe("kg");
		expect(result[0].category).toBe("vegetables");
	});

	it("remove ingredient", async () => {
		const t = convexTest(schema, modules);
		const asUser = t.withIdentity({ subject: "user1" });
		const id = await asUser.mutation(api.ingredients.create, {
			name: "Onion",
			unit: "pcs",
		});
		await asUser.mutation(api.ingredients.remove, { id });
		const result = await asUser.query(api.ingredients.list);
		expect(result).toHaveLength(0);
	});

	it("list only returns ingredients for the authenticated user", async () => {
		const t = convexTest(schema, modules);
		const asUser1 = t.withIdentity({ subject: "user1" });
		const asUser2 = t.withIdentity({ subject: "user2" });
		await asUser1.mutation(api.ingredients.create, {
			name: "Garlic",
			unit: "cloves",
		});
		const user2Results = await asUser2.query(api.ingredients.list);
		expect(user2Results).toHaveLength(0);
	});

	it("list throws when unauthenticated", async () => {
		const t = convexTest(schema, modules);
		await expect(t.query(api.ingredients.list)).rejects.toThrow(
			"Not authenticated",
		);
	});

	it("create throws when unauthenticated", async () => {
		const t = convexTest(schema, modules);
		await expect(
			t.mutation(api.ingredients.create, { name: "X", unit: "g" }),
		).rejects.toThrow("Not authenticated");
	});
});
