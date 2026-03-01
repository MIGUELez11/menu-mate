import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { ChefHat, Clock, Plus, Search, Tag, Users } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/recipes/")({
	ssr: false,
	component: RecipesPage,
});

function RecipesPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to browse recipes.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<RecipesList />
			</Authenticated>
		</>
	);
}

const DIFFICULTY_LABEL = {
	easy: "Easy",
	medium: "Medium",
	hard: "Hard",
} as const;

const DIFFICULTY_COLOR = {
	easy: "text-green-400",
	medium: "text-yellow-400",
	hard: "text-red-400",
} as const;

function RecipesList() {
	const [tagFilter, setTagFilter] = useState("");
	const [search, setSearch] = useState("");
	const recipes = useQuery(api.recipes.list, {
		...(tagFilter ? { tag: tagFilter } : {}),
		...(search ? { search } : {}),
	});

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-5xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<ChefHat size={24} />
						Recipes
					</h1>
					<Link
						to="/recipes/new"
						className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
					>
						<Plus size={18} />
						New Recipe
					</Link>
				</div>

				<div className="flex flex-wrap items-center gap-2 mb-4">
					<Search size={16} className="text-slate-400" />
					<input
						type="text"
						placeholder="Search recipes..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
					/>
					<Tag size={16} className="text-slate-400 ml-2" />
					<input
						type="text"
						placeholder="Filter by tag..."
						value={tagFilter}
						onChange={(e) => setTagFilter(e.target.value)}
						className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
					/>
					{(search || tagFilter) && (
						<button
							type="button"
							onClick={() => {
								setSearch("");
								setTagFilter("");
							}}
							className="text-slate-400 hover:text-white text-sm"
						>
							Clear
						</button>
					)}
				</div>

				{!recipes ? (
					<p className="text-slate-400">Loading...</p>
				) : recipes.length === 0 ? (
					<p className="text-slate-400">
						{search || tagFilter
							? "No recipes match your search."
							: "No recipes yet. Be the first to add one!"}
					</p>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{recipes.map((recipe) => (
							<Link
								key={recipe._id}
								to="/recipes/$recipeId"
								params={{ recipeId: recipe._id }}
								className="bg-slate-800 hover:bg-slate-700 rounded-xl overflow-hidden transition-colors group"
							>
								<div className="h-40 bg-slate-700 flex items-center justify-center overflow-hidden">
									{recipe.coverImageUrl ? (
										<img
											src={recipe.coverImageUrl}
											alt={recipe.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<ChefHat
											size={48}
											className="text-slate-500 group-hover:text-slate-400 transition-colors"
										/>
									)}
								</div>

								<div className="p-4">
									<h2 className="font-semibold text-lg mb-1 truncate">
										{recipe.name}
									</h2>
									{recipe.description && (
										<p className="text-slate-400 text-sm mb-2 line-clamp-2">
											{recipe.description}
										</p>
									)}

									<div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
										<span
											className={`font-medium ${DIFFICULTY_COLOR[recipe.difficulty]}`}
										>
											{DIFFICULTY_LABEL[recipe.difficulty]}
										</span>
										<span className="flex items-center gap-1">
											<Clock size={13} />
											{recipe.cookTimeMinutes}m
										</span>
										<span className="flex items-center gap-1">
											<Users size={13} />
											{recipe.portions}
										</span>
									</div>

									{recipe.tags.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{recipe.tags.map((tag) => (
												<span
													key={tag}
													className="px-2 py-0.5 bg-slate-600 rounded-full text-xs text-slate-300"
												>
													{tag}
												</span>
											))}
										</div>
									)}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
