import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/ingredients")({
	ssr: false,
	component: IngredientsPage,
});

function IngredientsPage() {
	useUser();
	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-white">Redirecting to sign in...</div>
			</Unauthenticated>
			<Authenticated>
				<IngredientsContent />
			</Authenticated>
		</>
	);
}

function IngredientsContent() {
	const ingredients = useQuery(api.ingredients.list);
	const createIngredient = useMutation(api.ingredients.create);
	const removeIngredient = useMutation(api.ingredients.remove);

	const [name, setName] = useState("");
	const [unit, setUnit] = useState("");
	const [category, setCategory] = useState("");

	const handleAdd = async () => {
		if (!name.trim() || !unit.trim()) return;
		await createIngredient({
			name: name.trim(),
			unit: unit.trim(),
			category: category.trim() || undefined,
		});
		setName("");
		setUnit("");
		setCategory("");
	};

	const handleRemove = async (id: Id<"ingredients">) => {
		await removeIngredient({ id });
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold text-white mb-6">Ingredients</h1>

			{/* Add Ingredient Form */}
			<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
				<h2 className="text-lg font-semibold text-white mb-3">Add Ingredient</h2>
				<div className="flex gap-3 flex-wrap">
					<Input
						placeholder="Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-40"
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					/>
					<Input
						placeholder="Unit (e.g. g, ml)"
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
						className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-40"
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					/>
					<Input
						placeholder="Category (optional)"
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-48"
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					/>
					<Button
						onClick={handleAdd}
						disabled={!name.trim() || !unit.trim()}
						className="bg-cyan-600 hover:bg-cyan-700 text-white"
					>
						Add
					</Button>
				</div>
			</div>

			{/* Ingredients Table */}
			{!ingredients ? (
				<div className="text-gray-400">Loading...</div>
			) : ingredients.length === 0 ? (
				<div className="text-gray-400">No ingredients yet. Add one above.</div>
			) : (
				<div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="border-gray-700 hover:bg-gray-800">
								<TableHead className="text-gray-400">Name</TableHead>
								<TableHead className="text-gray-400">Unit</TableHead>
								<TableHead className="text-gray-400">Category</TableHead>
								<TableHead className="text-gray-400 w-16" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{ingredients.map((ingredient) => (
								<TableRow
									key={ingredient._id}
									className="border-gray-700 hover:bg-gray-750"
								>
									<TableCell className="text-white font-medium">
										{ingredient.name}
									</TableCell>
									<TableCell className="text-gray-300">{ingredient.unit}</TableCell>
									<TableCell>
										{ingredient.category && (
											<Badge
												variant="secondary"
												className="bg-gray-700 text-cyan-400 border-gray-600"
											>
												{ingredient.category}
											</Badge>
										)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleRemove(ingredient._id)}
											className="text-red-400 hover:text-red-300 hover:bg-gray-700"
										>
											<Trash2 size={16} />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
