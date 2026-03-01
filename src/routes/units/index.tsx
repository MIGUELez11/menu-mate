import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Plus, Ruler } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/units/")({
	ssr: false,
	component: UnitsPage,
});

function UnitsPage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to manage units.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<UnitsList />
			</Authenticated>
		</>
	);
}

function UnitsList() {
	const [search, setSearch] = useState("");
	const units = useQuery(api.units.list, search ? { search } : {});

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-3xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<Ruler size={24} />
						Units of Measurement
					</h1>
					<Link
						to="/units/new"
						className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
					>
						<Plus size={18} />
						New Unit
					</Link>
				</div>

				<input
					type="text"
					placeholder="Search units..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-4 py-2 mb-4 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
				/>

				{!units ? (
					<p className="text-slate-400">Loading...</p>
				) : units.length === 0 ? (
					<p className="text-slate-400">No units found.</p>
				) : (
					<div className="space-y-2">
						{units.map((unit) => (
							<Link
								key={unit._id}
								to="/units/$id"
								params={{ id: unit._id }}
								className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
							>
								<span className="font-medium">{unit.name}</span>
								<span className="text-slate-400 font-mono">
									{unit.abbreviation}
								</span>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
