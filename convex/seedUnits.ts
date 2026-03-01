import { mutation } from "./_generated/server";

const DEFAULT_UNITS = [
	{ name: "grams", abbreviation: "g" },
	{ name: "kilograms", abbreviation: "kg" },
	{ name: "milliliters", abbreviation: "ml" },
	{ name: "liters", abbreviation: "L" },
	{ name: "teaspoons", abbreviation: "tsp" },
	{ name: "tablespoons", abbreviation: "tbsp" },
	{ name: "cups", abbreviation: "cup" },
	{ name: "units", abbreviation: "units" },
];

export const seed = mutation({
	args: {},
	handler: async (ctx) => {
		const existing = await ctx.db.query("units").collect();
		const existingAbbreviations = new Set(existing.map((u) => u.abbreviation));
		for (const unit of DEFAULT_UNITS) {
			if (!existingAbbreviations.has(unit.abbreviation)) {
				await ctx.db.insert("units", unit);
			}
		}
	},
});
