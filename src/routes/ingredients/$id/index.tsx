import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/ingredients/$id/")({
	ssr: false,
	component: IngredientDetailPage,
});

function IngredientDetailPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage ingredients.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<IngredientDetail />
			</Authenticated>
		</>
	);
}

function IngredientDetail() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const ingredient = useQuery(api.ingredients.getById, {
		id: id as Id<"ingredients">,
	});
	const units = useQuery(api.units.list, {});
	const deleteIngredient = useMutation(api.ingredients.deleteIngredient);
	const [error, setError] = useState<string | null>(null);

	const unitMap = new Map(units?.map((u) => [u._id, u]) ?? []);

	const handleDelete = async () => {
		setError(null);
		try {
			await deleteIngredient({ id: id as Id<"ingredients"> });
			await navigate({ to: "/ingredients" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete ingredient.",
			);
		}
	};

	if (ingredient === undefined) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Loading...</p>
			</div>
		);
	}

	if (ingredient === null) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Ingredient not found.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-md mx-auto">
				<Link
					to="/ingredients"
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Ingredients
				</Link>

				<div className="bg-slate-800 rounded-xl p-6 space-y-4">
					<h1 className="text-2xl font-bold">{ingredient.name}</h1>

					{ingredient.description && (
						<p className="text-slate-300">{ingredient.description}</p>
					)}

					<div>
						<h2 className="text-sm font-medium text-slate-400 mb-2">
							Allowed Units
						</h2>
						<div className="flex flex-wrap gap-2">
							{ingredient.allowedUnitIds.map((uid) => {
								const unit = unitMap.get(uid);
								const isPrimary = uid === ingredient.primaryUnitId;
								return unit ? (
									<span
										key={uid}
										className={`px-3 py-1 rounded-full text-sm font-medium ${
											isPrimary
												? "bg-cyan-600 text-white"
												: "bg-slate-700 text-slate-300"
										}`}
									>
										{unit.name} ({unit.abbreviation})
										{isPrimary && (
											<span className="ml-1 text-xs opacity-80">primary</span>
										)}
									</span>
								) : null;
							})}
						</div>
					</div>

					{error && <p className="text-red-400 text-sm">{error}</p>}

					<div className="flex gap-3 pt-2">
						<Link
							to="/ingredients/$id/edit"
							params={{ id }}
							className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
						>
							<Edit size={16} />
							Edit
						</Link>
						<button
							type="button"
							onClick={handleDelete}
							className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
						>
							<Trash2 size={16} />
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
