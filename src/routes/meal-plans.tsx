import { createFileRoute } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { useState } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/meal-plans")({
	ssr: false,
	component: MealPlansPage,
});

function weekStartFromDate(date: string) {
	if (!date) {
		return "";
	}
	const dt = new Date(`${date}T00:00:00.000Z`);
	const day = dt.getUTCDay();
	const offset = day === 0 ? -6 : 1 - day;
	dt.setUTCDate(dt.getUTCDate() + offset);
	return dt.toISOString().slice(0, 10);
}

function MealPlansPage() {
	const plans = useQuery(api.mealPlans.listWeeklyPlans);
	const recipes = useQuery(api.recipes.listRecipes);
	const createWeeklyPlan = useMutation(api.mealPlans.createWeeklyPlan);
	const upsertWeeklyPlanItem = useMutation(api.mealPlans.upsertWeeklyPlanItem);
	const removeWeeklyPlanItem = useMutation(api.mealPlans.removeWeeklyPlanItem);

	const [selectedPlanId, setSelectedPlanId] = useState<Id<"weeklyPlans"> | null>(null);
	const selectedPlan = useQuery(
		api.mealPlans.getWeeklyPlanWithItems,
		selectedPlanId ? { planId: selectedPlanId } : "skip",
	);
	const validation = useQuery(
		api.mealPlans.validateWeeklyPlanConstraints,
		selectedPlanId ? { planId: selectedPlanId } : "skip",
	);

	const [weekDateInput, setWeekDateInput] = useState("");
	const [slotDate, setSlotDate] = useState("");
	const [slotMealType, setSlotMealType] = useState<"breakfast" | "lunch" | "dinner">(
		"dinner",
	);
	const [slotRecipeId, setSlotRecipeId] = useState<Id<"recipes"> | "">("");

	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-center text-gray-300">Sign in required.</div>
			</Unauthenticated>
			<Authenticated>
				<div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
					<h1 className="text-3xl font-bold mb-2">Weekly Meal Plans</h1>
					<p className="text-zinc-400 mb-6">
						Assign recipes to breakfast/lunch/dinner slots and validate constraints.
					</p>

					<div className="grid gap-6 lg:grid-cols-2">
						<section className="rounded-xl border border-zinc-800 p-4 bg-zinc-900/60">
							<h2 className="text-xl font-semibold mb-4">Create/Select Week</h2>
							<div className="flex gap-2 mb-4">
								<input
									type="date"
									className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
									value={weekDateInput}
									onChange={(event) => setWeekDateInput(event.target.value)}
								/>
								<button
									type="button"
									className="rounded bg-emerald-600 px-3 py-2"
									onClick={async () => {
										const planId = await createWeeklyPlan({
											weekStartDate: weekStartFromDate(weekDateInput),
										});
										setSelectedPlanId(planId);
									}}
								>
									Create/select plan
								</button>
							</div>
							<div className="space-y-2 max-h-80 overflow-auto pr-2">
								{plans?.map((plan) => (
									<button
										key={plan._id}
										type="button"
										className={`w-full rounded border px-3 py-2 text-left ${
											selectedPlanId === plan._id
												? "border-emerald-400 bg-emerald-950/40"
												: "border-zinc-800 bg-zinc-950/70"
										}`}
										onClick={() => setSelectedPlanId(plan._id)}
									>
										Week of {plan.weekStartDate}
									</button>
								))}
							</div>
						</section>

						<section className="rounded-xl border border-zinc-800 p-4 bg-zinc-900/60">
							<h2 className="text-xl font-semibold mb-4">Plan Items</h2>
							{!selectedPlan ? (
								<p className="text-zinc-400">Select a plan first.</p>
							) : (
								<div className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
										<input
											type="date"
											className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
											value={slotDate}
											onChange={(event) => setSlotDate(event.target.value)}
										/>
										<select
											className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
											value={slotMealType}
											onChange={(event) =>
												setSlotMealType(
													event.target.value as "breakfast" | "lunch" | "dinner",
												)
											}
										>
											<option value="breakfast">Breakfast</option>
											<option value="lunch">Lunch</option>
											<option value="dinner">Dinner</option>
										</select>
										<select
											className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
											value={slotRecipeId}
											onChange={(event) => setSlotRecipeId(event.target.value as Id<"recipes">)}
										>
											<option value="">Select recipe</option>
											{recipes?.map((recipe) => (
												<option key={recipe._id} value={recipe._id}>
													{recipe.name}
												</option>
											))}
										</select>
										<button
											type="button"
											className="rounded bg-emerald-600 px-3 py-2"
											onClick={async () => {
												if (!slotRecipeId || !slotDate) {
													return;
												}
												await upsertWeeklyPlanItem({
													planId: selectedPlan._id,
													date: slotDate,
													mealType: slotMealType,
													recipeId: slotRecipeId,
												});
											}}
										>
											Save slot
										</button>
									</div>

									<div className="space-y-2 max-h-72 overflow-auto pr-2">
										{selectedPlan.items.map((item) => (
											<div
												key={item._id}
												className="rounded border border-zinc-800 bg-zinc-950/70 p-3 flex items-center justify-between"
											>
												<p>
													{item.date} - {item.mealType} - {item.recipeName}
												</p>
												<button
													type="button"
													className="rounded bg-rose-700 px-2 py-1 text-sm"
													onClick={() => removeWeeklyPlanItem({ itemId: item._id })}
												>
													Remove
												</button>
											</div>
										))}
									</div>

									<div className="rounded border border-zinc-800 bg-zinc-950/70 p-3">
										<h3 className="font-semibold mb-1">Constraint Validation</h3>
										<p className="text-sm text-zinc-300">
											Status: {validation?.isValid ? "valid" : "has violations"} | Soft score: {validation?.softScore ?? "-"}
										</p>
										<ul className="list-disc pl-5 mt-2 text-sm text-amber-300">
											{validation?.violations.map((violation) => (
												<li key={`${violation.type}-${violation.recipeId}-${violation.message}`}>
													{violation.message}
												</li>
											))}
										</ul>
									</div>
								</div>
							)}
						</section>
					</div>
				</div>
			</Authenticated>
		</>
	);
}
