import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/dishes/$dishId")({
	ssr: false,
	component: DishDetailPage,
});

function DishDetailPage() {
	useUser();
	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-white">Redirecting to sign in...</div>
			</Unauthenticated>
			<Authenticated>
				<DishDetailContent />
			</Authenticated>
		</>
	);
}

function DishDetailContent() {
	const { dishId } = Route.useParams();
	const dish = useQuery(api.dishes.get, { id: dishId as Id<"dishes"> });
	const recipe = useQuery(api.recipes.getByDish, {
		dishId: dishId as Id<"dishes">,
	});
	const ingredients = useQuery(api.ingredients.list);

	const updateDish = useMutation(api.dishes.update);
	const createRecipe = useMutation(api.recipes.createForDish);
	const addIngredient = useMutation(api.recipes.addIngredient);
	const removeIngredient = useMutation(api.recipes.removeIngredient);

	const [likeness, setLikeness] = useState<string>("");
	const [minTimes, setMinTimes] = useState<string>("");
	const [maxTimes, setMaxTimes] = useState<string>("");

	const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState("");

	if (dish === undefined) {
		return <div className="p-8 text-gray-400">Loading...</div>;
	}
	if (dish === null) {
		return <div className="p-8 text-white">Dish not found.</div>;
	}

	const handleSaveDish = async () => {
		await updateDish({
			id: dish._id,
			likeness: likeness ? Number(likeness) : undefined,
			minTimesPerWeek: minTimes ? Number(minTimes) : undefined,
			maxTimesPerWeek: maxTimes ? Number(maxTimes) : undefined,
		});
	};

	const handleCreateRecipe = async () => {
		await createRecipe({ dishId: dish._id, servings: 2 });
	};

	const handleAddIngredient = async () => {
		if (!recipe || !selectedIngredientId || !quantity || !unit) return;
		await addIngredient({
			recipeId: recipe._id,
			ingredientId: selectedIngredientId as Id<"ingredients">,
			quantity: Number(quantity),
			unit,
		});
		setSelectedIngredientId("");
		setQuantity("");
		setUnit("");
	};

	const handleRemoveIngredient = async (id: Id<"recipeIngredients">) => {
		await removeIngredient({ recipeIngredientId: id });
	};

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			<div className="flex items-center gap-3">
				<Link to="/dishes" className="text-gray-400 hover:text-white">
					<ArrowLeft size={20} />
				</Link>
				<h1 className="text-2xl font-bold text-white">{dish.name}</h1>
				<Badge className="bg-gray-700 text-cyan-400 border-gray-600">
					{dish.mealType}
				</Badge>
			</div>

			{/* Edit Dish Card */}
			<Card className="bg-gray-800 border-gray-700">
				<CardHeader>
					<CardTitle className="text-white">Dish Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						<div>
							<Label className="text-gray-300">Likeness (1–5)</Label>
							<Select
								value={likeness || String(dish.likeness)}
								onValueChange={setLikeness}
							>
								<SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-gray-700 border-gray-600">
									{[1, 2, 3, 4, 5].map((n) => (
										<SelectItem key={n} value={String(n)} className="text-white">
											{"★".repeat(n)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="text-gray-300">Min times/week</Label>
							<Input
								type="number"
								min={0}
								placeholder={String(dish.minTimesPerWeek)}
								value={minTimes}
								onChange={(e) => setMinTimes(e.target.value)}
								className="bg-gray-700 border-gray-600 text-white mt-1"
							/>
						</div>
						<div>
							<Label className="text-gray-300">Max times/week</Label>
							<Input
								type="number"
								min={0}
								placeholder={String(dish.maxTimesPerWeek)}
								value={maxTimes}
								onChange={(e) => setMaxTimes(e.target.value)}
								className="bg-gray-700 border-gray-600 text-white mt-1"
							/>
						</div>
					</div>
					<Button
						onClick={handleSaveDish}
						className="bg-cyan-600 hover:bg-cyan-700 text-white"
					>
						Save
					</Button>
				</CardContent>
			</Card>

			{/* Recipe Section */}
			<Card className="bg-gray-800 border-gray-700">
				<CardHeader>
					<CardTitle className="text-white">Recipe</CardTitle>
				</CardHeader>
				<CardContent>
					{recipe === undefined ? (
						<div className="text-gray-400">Loading...</div>
					) : recipe === null ? (
						<div className="space-y-3">
							<p className="text-gray-400">No recipe yet.</p>
							<Button
								onClick={handleCreateRecipe}
								className="bg-cyan-600 hover:bg-cyan-700 text-white"
							>
								Create Recipe
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-gray-400 text-sm">
								Servings: {recipe.servings}
								{recipe.notes && ` · ${recipe.notes}`}
							</p>

							{/* Ingredients Table */}
							{recipe.ingredients.length > 0 && (
								<div className="border border-gray-700 rounded-lg overflow-hidden">
									<Table>
										<TableHeader>
											<TableRow className="border-gray-700 hover:bg-gray-800">
												<TableHead className="text-gray-400">Ingredient</TableHead>
												<TableHead className="text-gray-400">Quantity</TableHead>
												<TableHead className="text-gray-400">Unit</TableHead>
												<TableHead className="text-gray-400 w-12" />
											</TableRow>
										</TableHeader>
										<TableBody>
											{recipe.ingredients.map((ri) => (
												<TableRow
													key={ri._id}
													className="border-gray-700 hover:bg-gray-750"
												>
													<TableCell className="text-white">
														{ri.ingredient?.name ?? "Unknown"}
													</TableCell>
													<TableCell className="text-gray-300">
														{ri.quantity}
													</TableCell>
													<TableCell className="text-gray-300">{ri.unit}</TableCell>
													<TableCell>
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																handleRemoveIngredient(
																	ri._id as Id<"recipeIngredients">,
																)
															}
															className="text-red-400 hover:text-red-300 hover:bg-gray-700"
														>
															<Trash2 size={14} />
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}

							{/* Add Ingredient Row */}
							<div className="flex gap-2 flex-wrap items-end">
								<div className="flex-1 min-w-36">
									<Label className="text-gray-300 text-sm">Ingredient</Label>
									<Select
										value={selectedIngredientId}
										onValueChange={setSelectedIngredientId}
									>
										<SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
											<SelectValue placeholder="Select ingredient" />
										</SelectTrigger>
										<SelectContent className="bg-gray-700 border-gray-600">
											{(ingredients ?? []).map((ing) => (
												<SelectItem
													key={ing._id}
													value={ing._id}
													className="text-white"
												>
													{ing.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="w-24">
									<Label className="text-gray-300 text-sm">Qty</Label>
									<Input
										type="number"
										min={0}
										value={quantity}
										onChange={(e) => setQuantity(e.target.value)}
										className="bg-gray-700 border-gray-600 text-white mt-1"
										placeholder="100"
									/>
								</div>
								<div className="w-24">
									<Label className="text-gray-300 text-sm">Unit</Label>
									<Input
										value={unit}
										onChange={(e) => setUnit(e.target.value)}
										className="bg-gray-700 border-gray-600 text-white mt-1"
										placeholder="g"
									/>
								</div>
								<Button
									onClick={handleAddIngredient}
									disabled={!selectedIngredientId || !quantity || !unit}
									className="bg-cyan-600 hover:bg-cyan-700 text-white"
								>
									<Plus size={16} />
									Add
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
