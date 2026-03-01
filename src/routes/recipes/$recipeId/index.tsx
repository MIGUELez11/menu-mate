import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import {
	ArrowLeft,
	ChefHat,
	Clock,
	ExternalLink,
	Lightbulb,
	Pencil,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/recipes/$recipeId/")({
	ssr: false,
	component: RecipeDetailPage,
});

function RecipeDetailPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to view recipes.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<RecipeDetail />
			</Authenticated>
		</>
	);
}

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFFICULTY_COLOR = {
	easy: "text-green-400",
	medium: "text-yellow-400",
	hard: "text-red-400",
};

function RecipeDetail() {
	const { recipeId } = Route.useParams();
	const navigate = useNavigate();
	const recipe = useQuery(api.recipes.getById, {
		id: recipeId as Id<"recipes">,
	});
	const remove = useMutation(api.recipes.remove);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	if (recipe === undefined) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Loading...</p>
			</div>
		);
	}

	if (recipe === null) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Recipe not found.</p>
			</div>
		);
	}

	const handleDelete = async () => {
		if (!confirm("Delete this recipe?")) return;
		setDeleting(true);
		setError(null);
		try {
			await remove({ id: recipeId as Id<"recipes"> });
			await navigate({ to: "/recipes" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete recipe.");
			setDeleting(false);
		}
	};

	const isValidVideoUrl = (url: string) =>
		/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)/.test(
			url,
		);

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-3xl mx-auto">
				<Link
					to="/recipes"
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Recipes
				</Link>

				{/* Cover image */}
				{recipe.coverImageUrl ? (
					<img
						src={recipe.coverImageUrl}
						alt={recipe.name}
						className="w-full h-64 object-cover rounded-xl mb-6"
					/>
				) : (
					<div className="w-full h-64 bg-slate-800 rounded-xl mb-6 flex items-center justify-center">
						<ChefHat size={64} className="text-slate-600" />
					</div>
				)}

				{/* Header */}
				<div className="flex items-start justify-between mb-4">
					<h1 className="text-3xl font-bold">{recipe.name}</h1>
					<div className="flex gap-2 ml-4 shrink-0">
						<Link
							to="/recipes/$recipeId/edit"
							params={{ recipeId }}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
						>
							<Pencil size={14} />
							Edit
						</Link>
						<button
							type="button"
							onClick={handleDelete}
							disabled={deleting}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors text-sm"
						>
							<Trash2 size={14} />
							Delete
						</button>
					</div>
				</div>

				{error && <p className="text-red-400 text-sm mb-4">{error}</p>}

				{/* Meta */}
				<div className="flex flex-wrap items-center gap-4 text-sm mb-4">
					<span
						className={`font-semibold ${DIFFICULTY_COLOR[recipe.difficulty]}`}
					>
						{DIFFICULTY_LABEL[recipe.difficulty]}
					</span>
					<span className="flex items-center gap-1 text-slate-300">
						<Clock size={14} />
						{recipe.cookTimeMinutes} min
					</span>
					<span className="flex items-center gap-1 text-slate-300">
						<Users size={14} />
						{recipe.portions} portion{recipe.portions !== 1 ? "s" : ""}
					</span>
				</div>

				{/* Tags */}
				{recipe.tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-4">
						{recipe.tags.map((tag) => (
							<span
								key={tag}
								className="px-2.5 py-1 bg-slate-700 rounded-full text-xs text-slate-300"
							>
								{tag}
							</span>
						))}
					</div>
				)}

				{/* Description */}
				{recipe.description && (
					<p className="text-slate-300 mb-6">{recipe.description}</p>
				)}

				{/* Video link */}
				{recipe.videoUrl && isValidVideoUrl(recipe.videoUrl) && (
					<a
						href={recipe.videoUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm mb-6"
					>
						<ExternalLink size={14} />
						Watch video
					</a>
				)}

				{/* Ingredients */}
				{recipe.ingredients.length > 0 && (
					<section className="mb-8">
						<h2 className="text-xl font-semibold mb-3">Ingredients</h2>
						<ul className="space-y-2">
							{recipe.ingredients.map((ri) => (
								<li
									key={ri._id}
									className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
								>
									<span className="font-medium flex items-center gap-2">
										{ri.ingredientName}
										{ri.optional && (
											<span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
												optional
											</span>
										)}
									</span>
									<span className="text-slate-400 text-sm">
										{ri.quantity}
										{ri.unitOverride ? ` ${ri.unitOverride}` : ""}
									</span>
								</li>
							))}
						</ul>
					</section>
				)}

				{/* Steps */}
				{recipe.steps.length > 0 && (
					<section className="mb-8">
						<h2 className="text-xl font-semibold mb-3">Steps</h2>
						<ol className="space-y-4">
							{recipe.steps.map((step, idx) => (
								<li key={step._id} className="flex gap-4">
									<span className="flex-shrink-0 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">
										{idx + 1}
									</span>
									<div className="flex-1">
										<p className="text-slate-200 leading-relaxed">
											{step.text}
										</p>
										{step.imageUrl && (
											<img
												src={step.imageUrl}
												alt={`Step ${idx + 1}`}
												className="mt-3 rounded-lg max-h-48 object-cover"
											/>
										)}
									</div>
								</li>
							))}
						</ol>
					</section>
				)}

				{/* Tips */}
				{recipe.tips.length > 0 && (
					<section className="mb-8 p-5 bg-amber-900/30 border border-amber-700/50 rounded-xl">
						<h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-amber-300">
							<Lightbulb size={20} />
							Tips &amp; Tricks
						</h2>
						<ul className="space-y-2">
							{recipe.tips.map((tip, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: tips have no ID
								<li key={i} className="flex gap-2 text-amber-100">
									<span className="text-amber-400 shrink-0">•</span>
									<span>{tip}</span>
								</li>
							))}
						</ul>
					</section>
				)}
			</div>
		</div>
	);
}
