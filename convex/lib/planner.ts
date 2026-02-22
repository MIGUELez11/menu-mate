export type ConstraintPreference = {
	recipeId: string;
	name: string;
	likeScore: number;
	minPerWeek?: number;
	targetPerWeek?: number;
	maxPerWeek?: number;
	allowConsecutiveDays: boolean;
	minGapDays?: number;
};

export type PlanItemInput = {
	recipeId: string;
	date: string;
	mealType: "breakfast" | "lunch" | "dinner";
};

export type ConstraintViolation = {
	type: "minPerWeek" | "maxPerWeek" | "consecutiveDays" | "minGapDays";
	recipeId: string;
	message: string;
};

export type PlanValidation = {
	isValid: boolean;
	softScore: number;
	violations: ConstraintViolation[];
	occurrences: Record<string, number>;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(dateStr: string) {
	const date = new Date(`${dateStr}T00:00:00.000Z`);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function uniqueSortedDayStamps(items: PlanItemInput[], recipeId: string) {
	const daySet = new Set(
		items.filter((item) => item.recipeId === recipeId).map((item) => item.date),
	);
	return Array.from(daySet)
		.map((date) => startOfDay(date))
		.sort((a, b) => a - b);
}

export function validatePlanConstraints(
	items: PlanItemInput[],
	preferences: ConstraintPreference[],
): PlanValidation {
	const occurrences: Record<string, number> = {};
	for (const item of items) {
		occurrences[item.recipeId] = (occurrences[item.recipeId] ?? 0) + 1;
	}

	const violations: ConstraintViolation[] = [];
	let softScore = 0;

	for (const pref of preferences) {
		const count = occurrences[pref.recipeId] ?? 0;

		if (pref.minPerWeek !== undefined && count < pref.minPerWeek) {
			violations.push({
				type: "minPerWeek",
				recipeId: pref.recipeId,
				message: `${pref.name} appears ${count} times, minimum is ${pref.minPerWeek}.`,
			});
		}

		if (pref.maxPerWeek !== undefined && count > pref.maxPerWeek) {
			violations.push({
				type: "maxPerWeek",
				recipeId: pref.recipeId,
				message: `${pref.name} appears ${count} times, maximum is ${pref.maxPerWeek}.`,
			});
		}

		if (pref.targetPerWeek !== undefined) {
			softScore += Math.abs(count - pref.targetPerWeek) * 10;
		}
		softScore += Math.max(0, 5 - pref.likeScore) * count;

		const days = uniqueSortedDayStamps(items, pref.recipeId);
		for (let i = 1; i < days.length; i++) {
			const gap = Math.round((days[i] - days[i - 1]) / MS_PER_DAY);
			if (!pref.allowConsecutiveDays && gap === 1) {
				violations.push({
					type: "consecutiveDays",
					recipeId: pref.recipeId,
					message: `${pref.name} is scheduled on consecutive days.`,
				});
			}
			if (pref.minGapDays !== undefined && gap < pref.minGapDays) {
				violations.push({
					type: "minGapDays",
					recipeId: pref.recipeId,
					message: `${pref.name} requires at least ${pref.minGapDays} day gap.`,
				});
			}
		}
	}

	return {
		isValid: violations.length === 0,
		softScore,
		violations,
		occurrences,
	};
}
