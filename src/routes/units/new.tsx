import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useId, useState } from "react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/units/new")({
	ssr: false,
	component: NewUnitPage,
});

function NewUnitPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage units.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<NewUnitForm />
			</Authenticated>
		</>
	);
}

function NewUnitForm() {
	const navigate = useNavigate();
	const create = useMutation(api.units.create);
	const [name, setName] = useState("");
	const [abbreviation, setAbbreviation] = useState("");
	const nameId = useId();
	const abbreviationId = useId();
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await create({ name: name.trim(), abbreviation: abbreviation.trim() });
			await navigate({ to: "/units" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create unit.");
		}
	};

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-md mx-auto">
				<Link
					to="/units"
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Units
				</Link>

				<h1 className="text-2xl font-bold mb-6">New Unit</h1>

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
							placeholder="e.g. grams"
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
							placeholder="e.g. g"
						/>
					</div>

					{error && <p className="text-red-400 text-sm">{error}</p>}

					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={!name.trim() || !abbreviation.trim()}
							className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
						>
							Create Unit
						</button>
						<Link
							to="/units"
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
