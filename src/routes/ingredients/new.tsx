import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useId, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/ingredients/new")({
	ssr: false,
	component: NewIngredientPage,
});

function NewIngredientPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage ingredients.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<NewIngredientForm />
			</Authenticated>
		</>
	);
}

function NewIngredientForm() {
	const navigate = useNavigate();
	const create = useMutation(api.ingredients.create);
	const units = useQuery(api.units.list, {});

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [allowedUnitIds, setAllowedUnitIds] = useState<Id<"units">[]>([]);
	const [primaryUnitId, setPrimaryUnitId] = useState<Id<"units"> | "">("");
	const [error, setError] = useState<string | null>(null);
	const nameId = useId();
	const descriptionId = useId();
	const primaryUnitSelectId = useId();

	const toggleUnit = (id: Id<"units">) => {
		setAllowedUnitIds((prev) => {
			const next = prev.includes(id)
				? prev.filter((u) => u !== id)
				: [...prev, id];
			if (primaryUnitId === id && !next.includes(id)) {
				setPrimaryUnitId(next[0] ?? "");
			}
			return next;
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!primaryUnitId) {
			setError("Please select a primary unit.");
			return;
		}
		try {
			await create({
				name: name.trim(),
				description: description.trim() || undefined,
				allowedUnitIds,
				primaryUnitId: primaryUnitId as Id<"units">,
			});
			await navigate({ to: "/ingredients" });
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create ingredient.",
			);
		}
	};

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

				<h1 className="text-2xl font-bold mb-6">New Ingredient</h1>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor={nameId}
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Name
						</label>
						<input
							id={nameId}
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
							placeholder="e.g. flour"
						/>
					</div>

					<div>
						<label
							htmlFor={descriptionId}
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Description (optional)
						</label>
						<textarea
							id={descriptionId}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 resize-none"
							placeholder="e.g. All-purpose flour"
						/>
					</div>

					<div>
						<p className="block text-sm font-medium text-slate-300 mb-2">
							Allowed Units
						</p>
						{!units ? (
							<p className="text-slate-400 text-sm">Loading units...</p>
						) : units.length === 0 ? (
							<p className="text-slate-400 text-sm">
								No units available.{" "}
								<Link to="/units/new" className="text-cyan-400 hover:underline">
									Create one
								</Link>
							</p>
						) : (
							<div className="space-y-1">
								{units.map((unit) => (
									<label
										key={unit._id}
										className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={allowedUnitIds.includes(unit._id)}
											onChange={() => toggleUnit(unit._id)}
											className="accent-cyan-500"
										/>
										<span>
											{unit.name}{" "}
											<span className="text-slate-400 font-mono text-sm">
												({unit.abbreviation})
											</span>
										</span>
									</label>
								))}
							</div>
						)}
					</div>

					{allowedUnitIds.length > 0 && (
						<div>
							<label
								htmlFor={primaryUnitSelectId}
								className="block text-sm font-medium text-slate-300 mb-1"
							>
								Primary Unit
							</label>
							<select
								id={primaryUnitSelectId}
								value={primaryUnitId}
								onChange={(e) =>
									setPrimaryUnitId(e.target.value as Id<"units">)
								}
								required
								className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
							>
								<option value="">Select primary unit</option>
								{allowedUnitIds.map((uid) => {
									const unit = units?.find((u) => u._id === uid);
									return unit ? (
										<option key={uid} value={uid}>
											{unit.name} ({unit.abbreviation})
										</option>
									) : null;
								})}
							</select>
						</div>
					)}

					{error && <p className="text-red-400 text-sm">{error}</p>}

					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={
								!name.trim() || allowedUnitIds.length === 0 || !primaryUnitId
							}
							className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
						>
							Create Ingredient
						</button>
						<Link
							to="/ingredients"
							className="flex-1 py-2 text-center bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
						>
							Cancel
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
