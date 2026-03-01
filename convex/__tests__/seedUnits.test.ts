import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.*s");

describe("seedUnits", () => {
	test("seeds 8 default units", async () => {
		const t = convexTest(schema, modules);
		await t.mutation(api.seedUnits.seed, {});
		const units = await t.query(api.units.list, {});
		expect(units).toHaveLength(8);
		const abbreviations = units.map((u) => u.abbreviation);
		expect(abbreviations).toContain("g");
		expect(abbreviations).toContain("kg");
		expect(abbreviations).toContain("ml");
		expect(abbreviations).toContain("L");
		expect(abbreviations).toContain("tsp");
		expect(abbreviations).toContain("tbsp");
		expect(abbreviations).toContain("cup");
		expect(abbreviations).toContain("units");
	});

	test("seed is idempotent — second run adds no duplicates", async () => {
		const t = convexTest(schema, modules);
		await t.mutation(api.seedUnits.seed, {});
		await t.mutation(api.seedUnits.seed, {});
		const units = await t.query(api.units.list, {});
		expect(units).toHaveLength(8);
	});
});
