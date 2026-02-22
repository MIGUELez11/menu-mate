import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const cards = [
		{
			title: "Recipes",
			description: "Create dishes, ingredients, and weekly preference constraints.",
			to: "/recipes",
			accent: "from-cyan-500/30 to-blue-500/10",
		},
		{
			title: "Meal Plans",
			description: "Assign breakfast/lunch/dinner slots and validate hard+soft rules.",
			to: "/meal-plans",
			accent: "from-emerald-500/30 to-lime-500/10",
		},
		{
			title: "Shopping List",
			description: "Compute deficits from planned recipes after pantry subtraction.",
			to: "/shopping-list",
			accent: "from-amber-500/30 to-orange-500/10",
		},
	];

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_45%,_#000_100%)] text-zinc-100 p-6 md:p-10">
			<section className="max-w-5xl mx-auto">
				<p className="inline-flex rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3 py-1 text-xs uppercase tracking-wider text-cyan-300">
					Menu Mate Prototype
				</p>
				<h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight">
					Plan meals with constraints, then shop what is missing.
				</h1>
				<p className="mt-4 max-w-3xl text-zinc-300">
					This phase includes recipe management, weekly slot planning, frequency and
					likeness controls, and computed shopping deficits.
				</p>
			</section>

			<section className="max-w-5xl mx-auto mt-10 grid gap-4 md:grid-cols-3">
				{cards.map((card) => (
					<Link
						key={card.to}
						to={card.to}
						className="group rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-zinc-600 transition-colors"
					>
						<div
							className={`h-1 w-16 rounded-full bg-gradient-to-r ${card.accent} mb-4`}
						/>
						<h2 className="text-2xl font-bold">{card.title}</h2>
						<p className="mt-2 text-zinc-300">{card.description}</p>
						<p className="mt-4 text-sm text-cyan-300 group-hover:text-cyan-200">
							Open module
						</p>
					</Link>
				))}
			</section>
		</div>
	);
}
