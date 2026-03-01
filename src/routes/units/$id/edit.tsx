import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/units/$id/edit")({
	ssr: false,
	component: EditUnitPage,
});

function EditUnitPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage units.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<EditUnitForm />
			</Authenticated>
		</>
	);
}

function EditUnitForm() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const unit = useQuery(api.units.getById, { id: id as Id<"units"> });
	const update = useMutation(api.units.update);
	const [name, setName] = useState("");
	const [abbreviation, setAbbreviation] = useState("");
	const [error, setError] = useState<string | null>(null);
	const nameId = useId();
	const abbreviationId = useId();

	useEffect(() => {
		if (unit) {
			setName(unit.name);
			setAbbreviation(unit.abbreviation);
		}
	}, [unit]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await update({
				id: id as Id<"units">,
				name: name.trim(),
				abbreviation: abbreviation.trim(),
			});
			await navigate({ to: "/units/$id", params: { id } });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update unit.");
		}
	};

	if (unit === undefined) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Loading...</p>
			</div>
		);
	}

	if (unit === null) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Unit not found.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-md mx-auto">
				<Link
					to="/units/$id"
					params={{ id }}
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Unit
				</Link>

				<h1 className="text-2xl font-bold mb-6">Edit Unit</h1>

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
						/>
					</div>
					<div>
						<label
							htmlFor={abbreviationId}
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Abbreviation
						</label>
						<input
							id={abbreviationId}
							type="text"
							value={abbreviation}
							onChange={(e) => setAbbreviation(e.target.value)}
							required
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
						/>
					</div>

					{error && <p className="text-red-400 text-sm">{error}</p>}

					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={!name.trim() || !abbreviation.trim()}
							className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
						>
							Save Changes
						</button>
						<Link
							to="/units/$id"
							params={{ id }}
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
