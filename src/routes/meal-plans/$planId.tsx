import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ArrowLeft, ListChecks, Plus, RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/meal-plans/$planId")({
	ssr: false,
	component: MealPlanDetailPage,
});

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MealPlanDetailPage() {
	useUser();
	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-white">Redirecting to sign in...</div>
			</Unauthenticated>
			<Authenticated>
				<MealPlanDetailContent />
			</Authenticated>
		</>
	);
}

function MealPlanDetailContent() {
	const { planId } = Route.useParams();
	const plan = useQuery(api.weeklyPlans.getWithItems, {
		id: planId as Id<"weeklyPlans">,
	});
	const dishes = useQuery(api.dishes.list);
	const shoppingList = useQuery(api.shoppingLists.getByPlan, {
		weeklyPlanId: planId as Id<"weeklyPlans">,
	});
	const addItem = useMutation(api.weeklyPlans.addItem);
	const removeItem = useMutation(api.weeklyPlans.removeItem);
	const generateList = useMutation(api.shoppingLists.generate);
	const [generating, setGenerating] = useState(false);

	// Per-cell add state: key = `${dayOfWeek}-${mealType}`
	const [selectedDish, setSelectedDish] = useState<Record<string, string>>({});

	const cellKey = (day: number, meal: MealType) => `${day}-${meal}`;

	// Group items by cell
	const itemsByCell = useMemo(() => {
		const map: Record<string, typeof plan.items> = {};
		if (!plan) return map;
		for (const item of plan.items) {
			const key = cellKey(item.dayOfWeek, item.mealType);
			if (!map[key]) map[key] = [];
			map[key].push(item);
		}
		return map;
	}, [plan]);

	if (plan === undefined) {
		return <div className="p-8 text-gray-400">Loading...</div>;
	}
	if (plan === null) {
		return <div className="p-8 text-white">Plan not found.</div>;
	}

	const handleAddItem = async (day: number, meal: MealType) => {
		const key = cellKey(day, meal);
		const dishId = selectedDish[key];
		if (!dishId) return;
		await addItem({
			weeklyPlanId: plan._id,
			dishId: dishId as Id<"dishes">,
			dayOfWeek: day,
			mealType: meal,
		});
		setSelectedDish((prev) => ({ ...prev, [key]: "" }));
	};

	const handleRemoveItem = async (itemId: Id<"weeklyPlanItems">) => {
		await removeItem({ itemId });
	};

	const handleGenerate = async () => {
		setGenerating(true);
		try {
			await generateList({ weeklyPlanId: plan._id });
		} finally {
			setGenerating(false);
		}
	};

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<div className="flex items-center gap-3 mb-6 flex-wrap">
				<Link to="/meal-plans" className="text-gray-400 hover:text-white">
					<ArrowLeft size={20} />
				</Link>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-white">
						{plan.name ?? `Week of ${plan.weekStartDate}`}
					</h1>
					<p className="text-gray-400 text-sm">Starting {plan.weekStartDate}</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={handleGenerate}
						disabled={generating}
						className="bg-cyan-600 hover:bg-cyan-700 text-white"
					>
						<RefreshCw size={16} className={generating ? "animate-spin" : ""} />
						{generating ? "Generating..." : "Generate Shopping List"}
					</Button>
					{shoppingList && (
						<Link
							to="/shopping-lists/$listId"
							params={{ listId: shoppingList._id }}
						>
							<Button
								variant="outline"
								className="border-cyan-700 text-cyan-400 hover:bg-gray-700"
							>
								<ListChecks size={16} />
								View List
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* 4×7 grid */}
			<div className="overflow-x-auto">
				<table className="w-full border-collapse min-w-[800px]">
					<thead>
						<tr>
							<th className="text-gray-400 text-sm font-medium p-2 text-left w-24">
								Meal
							</th>
							{DAYS.map((day) => (
								<th
									key={day}
									className="text-gray-400 text-sm font-medium p-2 text-center"
								>
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{MEAL_TYPES.map((meal) => (
							<tr key={meal} className="border-t border-gray-700">
								<td className="p-2 text-gray-300 text-sm capitalize font-medium align-top pt-3">
									{meal}
								</td>
								{DAYS.map((_, dayIdx) => {
									const key = cellKey(dayIdx, meal);
									const cellItems = itemsByCell[key] ?? [];
									return (
										<td
											key={dayIdx}
											className="p-2 align-top border-l border-gray-700 min-w-[120px]"
										>
											{/* Dish chips */}
											<div className="space-y-1 mb-2">
												{cellItems.map((item) => (
													<div
														key={item._id}
														className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1 text-xs"
													>
														<span className="text-white flex-1 truncate">
															{item.dish?.name ?? "Unknown"}
														</span>
														<button
															onClick={() =>
																handleRemoveItem(
																	item._id as Id<"weeklyPlanItems">,
																)
															}
															className="text-gray-400 hover:text-red-400 flex-shrink-0"
														>
															<X size={10} />
														</button>
													</div>
												))}
											</div>
											{/* Add dish */}
											<div className="flex gap-1">
												<Select
													value={selectedDish[key] ?? ""}
													onValueChange={(v) =>
														setSelectedDish((prev) => ({ ...prev, [key]: v }))
													}
												>
													<SelectTrigger className="bg-gray-700 border-gray-600 text-white h-7 text-xs flex-1 min-w-0">
														<SelectValue placeholder="Add..." />
													</SelectTrigger>
													<SelectContent className="bg-gray-700 border-gray-600">
														{(dishes ?? []).map((d) => (
															<SelectItem
																key={d._id}
																value={d._id}
																className="text-white text-xs"
															>
																{d.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Button
													size="icon"
													className="h-7 w-7 bg-cyan-600 hover:bg-cyan-700 flex-shrink-0"
													disabled={!selectedDish[key]}
													onClick={() => handleAddItem(dayIdx, meal)}
												>
													<Plus size={12} />
												</Button>
											</div>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
