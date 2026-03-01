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

export const Route = createFileRoute("/units/$id/")({
	ssr: false,
	component: UnitDetailPage,
});

function UnitDetailPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage units.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<UnitDetail />
			</Authenticated>
		</>
	);
}

function UnitDetail() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const unit = useQuery(api.units.getById, { id: id as Id<"units"> });
	const deleteUnit = useMutation(api.units.deleteUnit);
	const [error, setError] = useState<string | null>(null);

	const handleDelete = async () => {
		setError(null);
		try {
			await deleteUnit({ id: id as Id<"units"> });
			await navigate({ to: "/units" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete unit.");
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
					to="/units"
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Units
				</Link>

				<div className="bg-slate-800 rounded-xl p-6">
					<h1 className="text-2xl font-bold mb-1">{unit.name}</h1>
					<p className="text-slate-400 text-lg font-mono mb-6">
						{unit.abbreviation}
					</p>

					{error && <p className="text-red-400 text-sm mb-4">{error}</p>}

					<div className="flex gap-3">
						<Link
							to="/units/$id/edit"
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
