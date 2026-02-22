import { createFileRoute } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/recipes")({
	ssr: false,
	component: RecipesPage,
});

type IngredientFormRow = {
	id: string;
	name: string;
	quantity: string;
	unit: string;
	optional: boolean;
};

function createIngredientRow(): IngredientFormRow {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		name: "",
		quantity: "1",
		unit: "unit",
		optional: false,
	};
}

function RecipesPage() {
	const recipes = useQuery(api.recipes.listRecipes);
	const createRecipe = useMutation(api.recipes.createRecipe);
	const updateRecipe = useMutation(api.recipes.updateRecipe);
	const deleteRecipe = useMutation(api.recipes.deleteRecipe);
	const upsertRecipeIngredients = useMutation(api.recipes.upsertRecipeIngredients);
	const upsertRecipePreferences = useMutation(api.recipes.upsertRecipePreferences);

	const [newName, setNewName] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [selectedRecipeId, setSelectedRecipeId] = useState<Id<"recipes"> | null>(null);

	const selectedRecipe = useQuery(
		api.recipes.getRecipe,
		selectedRecipeId ? { recipeId: selectedRecipeId } : "skip",
	);

	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editInstructions, setEditInstructions] = useState("");
	const [editServings, setEditServings] = useState("");
	const [ingredients, setIngredients] = useState<IngredientFormRow[]>([]);
	const [likeScore, setLikeScore] = useState("3");
	const [minPerWeek, setMinPerWeek] = useState("");
	const [targetPerWeek, setTargetPerWeek] = useState("");
	const [maxPerWeek, setMaxPerWeek] = useState("");
	const [allowConsecutiveDays, setAllowConsecutiveDays] = useState(true);
	const [minGapDays, setMinGapDays] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (!selectedRecipe) {
			return;
		}
		setEditName(selectedRecipe.name);
		setEditDescription(selectedRecipe.description ?? "");
		setEditInstructions(selectedRecipe.instructions ?? "");
		setEditServings(selectedRecipe.servings?.toString() ?? "");
		setIngredients(
			selectedRecipe.ingredients.map((ingredient) => ({
				id: `${ingredient._id}`,
				name: ingredient.ingredientName,
				quantity: ingredient.quantity.toString(),
				unit: ingredient.unit,
				optional: ingredient.optional,
			})),
		);
		setLikeScore((selectedRecipe.preference?.likeScore ?? 3).toString());
		setMinPerWeek(selectedRecipe.preference?.minPerWeek?.toString() ?? "");
		setTargetPerWeek(selectedRecipe.preference?.targetPerWeek?.toString() ?? "");
		setMaxPerWeek(selectedRecipe.preference?.maxPerWeek?.toString() ?? "");
		setAllowConsecutiveDays(selectedRecipe.preference?.allowConsecutiveDays ?? true);
		setMinGapDays(selectedRecipe.preference?.minGapDays?.toString() ?? "");
		setNotes(selectedRecipe.preference?.notes ?? "");
	}, [selectedRecipe]);

	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-center text-gray-300">Sign in required.</div>
			</Unauthenticated>
			<Authenticated>
				<div className="min-h-screen bg-slate-950 text-slate-100 p-6">
					<h1 className="text-3xl font-bold mb-2">Recipes</h1>
					<p className="text-slate-400 mb-6">
						Create recipes, set likeness/frequency constraints, and maintain ingredients.
					</p>

					<div className="grid gap-6 lg:grid-cols-2">
						<section className="rounded-xl border border-slate-800 p-4 bg-slate-900/60">
							<h2 className="text-xl font-semibold mb-4">Create Recipe</h2>
							<div className="space-y-3">
								<input
									className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
									placeholder="Recipe name"
									value={newName}
									onChange={(event) => setNewName(event.target.value)}
								/>
								<textarea
									className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
									placeholder="Description"
									value={newDescription}
									onChange={(event) => setNewDescription(event.target.value)}
								/>
								<button
									type="button"
									className="rounded bg-cyan-600 px-3 py-2 font-medium text-white"
									onClick={async () => {
										const recipeId = await createRecipe({
											name: newName,
											description: newDescription,
										});
										setNewName("");
										setNewDescription("");
										setSelectedRecipeId(recipeId);
									}}
								>
									Create recipe
								</button>
							</div>

							<h3 className="text-lg font-semibold mt-6 mb-3">Existing Recipes</h3>
							<div className="space-y-2 max-h-80 overflow-auto pr-2">
								{recipes?.map((recipe) => (
									<div
										key={recipe._id}
										className="rounded border border-slate-800 bg-slate-950/70 p-3"
									>
										<div className="flex items-center justify-between gap-2">
											<div>
												<p className="font-medium">{recipe.name}</p>
												<p className="text-xs text-slate-400">
													Like: {recipe.preference?.likeScore ?? "-"}
												</p>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													className="rounded bg-slate-700 px-2 py-1 text-sm"
													onClick={() => setSelectedRecipeId(recipe._id)}
												>
													Edit
												</button>
												<button
													type="button"
													className="rounded bg-rose-700 px-2 py-1 text-sm"
													onClick={async () => {
														await deleteRecipe({ recipeId: recipe._id });
														if (selectedRecipeId === recipe._id) {
															setSelectedRecipeId(null);
														}
													}}
												>
													Delete
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</section>

						<section className="rounded-xl border border-slate-800 p-4 bg-slate-900/60">
							<h2 className="text-xl font-semibold mb-4">Edit Recipe Details</h2>
							{!selectedRecipe ? (
								<p className="text-slate-400">Select a recipe to edit.</p>
							) : (
								<div className="space-y-4">
									<input
										className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
										value={editName}
										onChange={(event) => setEditName(event.target.value)}
									/>
									<textarea
										className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
										value={editDescription}
										onChange={(event) => setEditDescription(event.target.value)}
									/>
									<textarea
										className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
										value={editInstructions}
										onChange={(event) => setEditInstructions(event.target.value)}
										placeholder="Instructions"
									/>
									<input
										type="number"
										className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
										value={editServings}
										onChange={(event) => setEditServings(event.target.value)}
										placeholder="Servings"
									/>

									<div className="rounded border border-slate-800 p-3">
										<h3 className="font-semibold mb-2">Ingredients</h3>
										<div className="space-y-2">
											{ingredients.map((ingredient, index) => (
												<div key={ingredient.id} className="grid grid-cols-12 gap-2">
													<input
														className="col-span-5 rounded border border-slate-700 bg-slate-950 px-2 py-1"
														placeholder="Name"
														value={ingredient.name}
														onChange={(event) => {
															const next = [...ingredients];
															next[index] = { ...next[index], name: event.target.value };
															setIngredients(next);
														}}
													/>
													<input
														type="number"
														className="col-span-2 rounded border border-slate-700 bg-slate-950 px-2 py-1"
														placeholder="Qty"
														value={ingredient.quantity}
														onChange={(event) => {
															const next = [...ingredients];
															next[index] = { ...next[index], quantity: event.target.value };
															setIngredients(next);
														}}
													/>
													<input
														className="col-span-2 rounded border border-slate-700 bg-slate-950 px-2 py-1"
														placeholder="Unit"
														value={ingredient.unit}
														onChange={(event) => {
															const next = [...ingredients];
															next[index] = { ...next[index], unit: event.target.value };
															setIngredients(next);
														}}
													/>
													<label className="col-span-2 flex items-center gap-1 text-xs">
														<input
															type="checkbox"
															checked={ingredient.optional}
															onChange={(event) => {
																const next = [...ingredients];
																next[index] = {
																	...next[index],
																	optional: event.target.checked,
																};
																setIngredients(next);
															}}
														/>
														Optional
													</label>
													<button
														type="button"
														className="col-span-1 rounded bg-slate-700 text-xs"
														onClick={() => {
															setIngredients(ingredients.filter((_, i) => i !== index));
														}}
													>
														X
													</button>
												</div>
											))}
										</div>
										<button
											type="button"
											className="mt-2 rounded bg-slate-700 px-2 py-1 text-sm"
											onClick={() =>
												setIngredients([
													...ingredients,
													createIngredientRow(),
												])
											}
										>
											Add ingredient row
										</button>
									</div>

									<div className="rounded border border-slate-800 p-3 space-y-2">
										<h3 className="font-semibold">Preference & Constraints</h3>
										<div className="grid grid-cols-2 gap-2">
											<label className="text-sm">
												Like (1-5)
												<input
													type="number"
													className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
													value={likeScore}
													onChange={(event) => setLikeScore(event.target.value)}
												/>
											</label>
											<label className="text-sm">
												Min/week
												<input
													type="number"
													className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
													value={minPerWeek}
													onChange={(event) => setMinPerWeek(event.target.value)}
												/>
											</label>
											<label className="text-sm">
												Target/week
												<input
													type="number"
													className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
													value={targetPerWeek}
													onChange={(event) => setTargetPerWeek(event.target.value)}
												/>
											</label>
											<label className="text-sm">
												Max/week
												<input
													type="number"
													className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
													value={maxPerWeek}
													onChange={(event) => setMaxPerWeek(event.target.value)}
												/>
											</label>
											<label className="text-sm">
												Min gap days
												<input
													type="number"
													className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1"
													value={minGapDays}
													onChange={(event) => setMinGapDays(event.target.value)}
												/>
											</label>
											<label className="text-sm flex items-end gap-2">
												<input
													type="checkbox"
													checked={allowConsecutiveDays}
													onChange={(event) => setAllowConsecutiveDays(event.target.checked)}
												/>
												Allow consecutive days
											</label>
										</div>
										<textarea
											className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
											value={notes}
											onChange={(event) => setNotes(event.target.value)}
											placeholder="Constraint notes (e.g. guisos can repeat)"
										/>
									</div>

									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											className="rounded bg-cyan-600 px-3 py-2 font-medium"
											onClick={async () => {
												await updateRecipe({
													recipeId: selectedRecipe._id,
													name: editName,
													description: editDescription,
													instructions: editInstructions,
													servings: editServings ? Number(editServings) : undefined,
												});
												await upsertRecipeIngredients({
													recipeId: selectedRecipe._id,
													ingredients: ingredients
														.filter((ingredient) => ingredient.name.trim().length > 0)
														.map((ingredient) => ({
															name: ingredient.name,
															quantity: Number(ingredient.quantity || "0"),
															unit: ingredient.unit,
															optional: ingredient.optional,
														})),
												});
												await upsertRecipePreferences({
													recipeId: selectedRecipe._id,
													likeScore: Number(likeScore),
													minPerWeek: minPerWeek ? Number(minPerWeek) : undefined,
													targetPerWeek: targetPerWeek ? Number(targetPerWeek) : undefined,
													maxPerWeek: maxPerWeek ? Number(maxPerWeek) : undefined,
													allowConsecutiveDays,
													minGapDays: minGapDays ? Number(minGapDays) : undefined,
													notes,
												});
											}}
										>
											Save all changes
										</button>
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
