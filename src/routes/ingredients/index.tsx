import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Plus, Sprout } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/ingredients/")({
	ssr: false,
	component: IngredientsPage,
});

function IngredientsPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage ingredients.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<IngredientsList />
			</Authenticated>
		</>
	);
}

function IngredientsList() {
	const [search, setSearch] = useState("");
	const ingredients = useQuery(api.ingredients.list, search ? { search } : {});
	const units = useQuery(api.units.list, {});

	const unitMap = new Map(units?.map((u) => [u._id, u]) ?? []);

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-3xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Sprout size={24} />
						Ingredients
					</h1>
					<Link
						to="/ingredients/new"
						className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
					>
						<Plus size={18} />
						New Ingredient
					</Link>
				</div>

				<input
					type="text"
					placeholder="Search ingredients..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-4 py-2 mb-4 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
				/>

				{!ingredients ? (
					<p className="text-slate-400">Loading...</p>
				) : ingredients.length === 0 ? (
					<p className="text-slate-400">No ingredients found.</p>
				) : (
					<div className="space-y-2">
						{ingredients.map((ingredient) => {
							const primaryUnit = unitMap.get(ingredient.primaryUnitId);
							return (
								<Link
									key={ingredient._id}
									to="/ingredients/$id"
									params={{ id: ingredient._id }}
									className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
								>
									<div>
										<span className="font-medium">{ingredient.name}</span>
										{ingredient.description && (
											<p className="text-slate-400 text-sm mt-0.5">
												{ingredient.description}
											</p>
										)}
									</div>
									{primaryUnit && (
										<span className="text-slate-400 font-mono text-sm">
											{primaryUnit.abbreviation}
										</span>
									)}
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
