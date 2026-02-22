export type IngredientNeedInput = {
	ingredientId: string;
	ingredientName: string;
	quantity: number;
	unit: string;
};

export type PantryInput = {
	ingredientId: string;
	quantity: number;
	unit: string;
};

export type ShoppingDeficit = {
	ingredientId: string;
	ingredientName: string;
	needed: number;
	inPantry: number;
	toBuy: number;
	unit: string;
};

export type UnitConflict = {
	ingredientId: string;
	ingredientName: string;
	recipeUnits: string[];
	pantryUnits: string[];
};

function roundQuantity(value: number) {
	return Math.round(value * 100) / 100;
}

export function computeShoppingDeficits(
	needs: IngredientNeedInput[],
	pantryItems: PantryInput[],
) {
	const neededByKey = new Map<string, IngredientNeedInput>();
	for (const need of needs) {
		const key = `${need.ingredientId}:${need.unit}`;
		const current = neededByKey.get(key);
		if (current) {
			current.quantity += need.quantity;
		} else {
			neededByKey.set(key, { ...need });
		}
	}

	const pantryByKey = new Map<string, number>();
	const pantryUnitsByIngredient = new Map<string, Set<string>>();
	for (const pantry of pantryItems) {
		const key = `${pantry.ingredientId}:${pantry.unit}`;
		pantryByKey.set(key, (pantryByKey.get(key) ?? 0) + pantry.quantity);
		const units = pantryUnitsByIngredient.get(pantry.ingredientId) ?? new Set<string>();
		units.add(pantry.unit);
		pantryUnitsByIngredient.set(pantry.ingredientId, units);
	}

	const deficits: ShoppingDeficit[] = [];
	const conflicts: UnitConflict[] = [];
	const recipeUnitsByIngredient = new Map<string, Set<string>>();

	for (const need of neededByKey.values()) {
		const units = recipeUnitsByIngredient.get(need.ingredientId) ?? new Set<string>();
		units.add(need.unit);
		recipeUnitsByIngredient.set(need.ingredientId, units);

		const key = `${need.ingredientId}:${need.unit}`;
		const inPantry = pantryByKey.get(key) ?? 0;
		const toBuy = Math.max(0, need.quantity - inPantry);
		if (toBuy > 0) {
			deficits.push({
				ingredientId: need.ingredientId,
				ingredientName: need.ingredientName,
				needed: roundQuantity(need.quantity),
				inPantry: roundQuantity(inPantry),
				toBuy: roundQuantity(toBuy),
				unit: need.unit,
			});
		}
	}

	for (const [ingredientId, recipeUnitsSet] of recipeUnitsByIngredient.entries()) {
		const pantryUnitsSet = pantryUnitsByIngredient.get(ingredientId);
		if (!pantryUnitsSet || pantryUnitsSet.size === 0) {
			continue;
		}
		const recipeUnits = Array.from(recipeUnitsSet);
		const pantryUnits = Array.from(pantryUnitsSet);
		const hasOverlap = recipeUnits.some((unit) => pantryUnitsSet.has(unit));
		if (!hasOverlap) {
			conflicts.push({
				ingredientId,
				ingredientName:
					needs.find((need) => need.ingredientId === ingredientId)?.ingredientName ??
					ingredientId,
				recipeUnits,
				pantryUnits,
			});
		}
	}

	deficits.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
	conflicts.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

	return { deficits, unresolvedUnitConflicts: conflicts };
}
