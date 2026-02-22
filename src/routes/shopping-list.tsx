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

export const Route = createFileRoute("/shopping-list")({
	ssr: false,
	component: ShoppingListPage,
});

function ShoppingListPage() {
	const plans = useQuery(api.mealPlans.listWeeklyPlans);
	const ingredients = useQuery(api.recipes.listIngredients);
	const pantryItems = useQuery(api.pantry.listPantryItems);

	const upsertPantryItem = useMutation(api.pantry.upsertPantryItem);
	const removePantryItem = useMutation(api.pantry.removePantryItem);

	const [selectedPlanId, setSelectedPlanId] = useState<Id<"weeklyPlans"> | null>(null);
	const shoppingList = useQuery(
		api.shoppingLists.getShoppingListForPlan,
		selectedPlanId ? { planId: selectedPlanId } : "skip",
	);

	const [pantryIngredientId, setPantryIngredientId] = useState<Id<"ingredients"> | "">("");
	const [pantryQuantity, setPantryQuantity] = useState("0");
	const [pantryUnit, setPantryUnit] = useState("unit");
	const [pantryLocation, setPantryLocation] = useState<"pantry" | "fridge" | "freezer">(
		"pantry",
	);

	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-center text-gray-300">Sign in required.</div>
			</Unauthenticated>
			<Authenticated>
				<div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
					<h1 className="text-3xl font-bold mb-2">Shopping List</h1>
					<p className="text-neutral-400 mb-6">
						Choose a weekly plan and get the ingredient deficits to buy.
					</p>

					<div className="grid gap-6 lg:grid-cols-2">
						<section className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/60">
							<h2 className="text-xl font-semibold mb-4">Select Weekly Plan</h2>
							<div className="space-y-2">
								{plans?.map((plan) => (
									<button
										key={plan._id}
										type="button"
										className={`w-full rounded border px-3 py-2 text-left ${
											selectedPlanId === plan._id
												? "border-sky-400 bg-sky-950/40"
												: "border-neutral-800 bg-neutral-950/70"
										}`}
										onClick={() => setSelectedPlanId(plan._id)}
									>
										Week of {plan.weekStartDate}
									</button>
								))}
							</div>

							<div className="mt-6 rounded border border-neutral-800 bg-neutral-950/70 p-3">
								<h3 className="font-semibold mb-2">Pantry Inventory</h3>
								<div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
									<select
										className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1"
										value={pantryIngredientId}
										onChange={(event) =>
											setPantryIngredientId(event.target.value as Id<"ingredients">)
										}
									>
										<option value="">Ingredient</option>
										{ingredients?.map((ingredient) => (
											<option key={ingredient._id} value={ingredient._id}>
												{ingredient.name}
											</option>
										))}
									</select>
									<input
										type="number"
										className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1"
										value={pantryQuantity}
										onChange={(event) => setPantryQuantity(event.target.value)}
										placeholder="Qty"
									/>
									<input
										className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1"
										value={pantryUnit}
										onChange={(event) => setPantryUnit(event.target.value)}
										placeholder="Unit"
									/>
									<select
										className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1"
										value={pantryLocation}
										onChange={(event) =>
											setPantryLocation(
												event.target.value as "pantry" | "fridge" | "freezer",
											)
										}
									>
										<option value="pantry">Pantry</option>
										<option value="fridge">Fridge</option>
										<option value="freezer">Freezer</option>
									</select>
									<button
										type="button"
										className="rounded bg-sky-600 px-2 py-1"
										onClick={() => {
											if (!pantryIngredientId) {
												return;
											}
											upsertPantryItem({
												ingredientId: pantryIngredientId,
												quantity: Number(pantryQuantity),
												unit: pantryUnit,
												location: pantryLocation,
											});
										}}
									>
										Save
									</button>
								</div>
								<div className="space-y-1 max-h-52 overflow-auto">
									{pantryItems?.map((item) => (
										<div
											key={item._id}
											className="rounded border border-neutral-800 bg-neutral-900 p-2 flex items-center justify-between"
										>
											<span>
												{item.ingredientName}: {item.quantity} {item.unit} ({item.location})
											</span>
											<button
												type="button"
												className="rounded bg-rose-700 px-2 py-1 text-sm"
												onClick={() => removePantryItem({ pantryItemId: item._id })}
											>
												Remove
											</button>
										</div>
									))}
								</div>
							</div>
						</section>

						<section className="rounded-xl border border-neutral-800 p-4 bg-neutral-900/60">
							<h2 className="text-xl font-semibold mb-4">Computed Deficits</h2>
							{!selectedPlanId ? (
								<p className="text-neutral-400">Select a plan to compute shopping list.</p>
							) : (
								<div className="space-y-4">
									<div>
										<h3 className="font-medium">Need to Buy</h3>
										<ul className="list-disc pl-5 mt-2 text-sm">
											{shoppingList?.deficits.map((deficit) => (
												<li key={`${deficit.ingredientId}:${deficit.unit}`}>
													{deficit.ingredientName}: buy {deficit.toBuy} {deficit.unit}
													(need {deficit.needed}, pantry {deficit.inPantry})
												</li>
											))}
										</ul>
									</div>

									<div>
										<h3 className="font-medium">Unit Conflicts</h3>
										<ul className="list-disc pl-5 mt-2 text-sm text-amber-300">
											{shoppingList?.unresolvedUnitConflicts.map((conflict) => (
												<li key={conflict.ingredientId}>
													{conflict.ingredientName}: recipe units [{conflict.recipeUnits.join(", ")}], pantry units [{conflict.pantryUnits.join(", ")}]
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
