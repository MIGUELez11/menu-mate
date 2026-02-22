import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/shopping-lists/$listId")({
	ssr: false,
	component: ShoppingListPage,
});

function ShoppingListPage() {
	useUser();
	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-white">Redirecting to sign in...</div>
			</Unauthenticated>
			<Authenticated>
				<ShoppingListContent />
			</Authenticated>
		</>
	);
}

function ShoppingListContent() {
	const { listId } = Route.useParams();
	const shoppingList = useQuery(api.shoppingLists.getWithItems, {
		listId: listId as Id<"shoppingLists">,
	});
	const togglePurchased = useMutation(api.shoppingLists.togglePurchased);
	const deleteList = useMutation(api.shoppingLists.deleteList);

	const grouped = useMemo(() => {
		if (!shoppingList) return {};
		const map: Record<string, typeof shoppingList.items> = {};
		for (const item of shoppingList.items) {
			const cat = item.category ?? "Other";
			if (!map[cat]) map[cat] = [];
			map[cat].push(item);
		}
		return map;
	}, [shoppingList]);

	if (shoppingList === undefined) {
		return <div className="p-8 text-gray-400">Loading...</div>;
	}
	if (shoppingList === null) {
		return <div className="p-8 text-white">Shopping list not found.</div>;
	}

	const total = shoppingList.items.length;
	const purchased = shoppingList.items.filter((i) => i.purchased).length;
	const progress = total > 0 ? Math.round((purchased / total) * 100) : 0;

	const handleToggle = async (itemId: Id<"shoppingListItems">) => {
		await togglePurchased({ itemId });
	};

	const handleDelete = async () => {
		await deleteList({ listId: listId as Id<"shoppingLists"> });
	};

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<div className="flex items-center gap-3 mb-4">
				<Link
					to="/meal-plans/$planId"
					params={{ planId: shoppingList.weeklyPlanId }}
					className="text-gray-400 hover:text-white"
				>
					<ArrowLeft size={20} />
				</Link>
				<h1 className="text-2xl font-bold text-white flex-1">Shopping List</h1>
			</div>

			{/* Progress */}
			<div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
				<div className="flex justify-between text-sm text-gray-400 mb-2">
					<span>{purchased} of {total} purchased</span>
					<span>{progress}%</span>
				</div>
				<Progress value={progress} className="h-2 bg-gray-700" />
			</div>

			{/* Items grouped by category */}
			{total === 0 ? (
				<div className="text-gray-400">No items in this list.</div>
			) : (
				<div className="space-y-4">
					{Object.entries(grouped)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([category, items]) => (
							<Card key={category} className="bg-gray-800 border-gray-700">
								<CardHeader className="pb-2 pt-4 px-4">
									<CardTitle className="text-cyan-400 text-sm uppercase tracking-wide">
										{category}
									</CardTitle>
								</CardHeader>
								<CardContent className="px-4 pb-4 space-y-2">
									{items.map((item) => (
										<div
											key={item._id}
											className="flex items-center gap-3"
										>
											<Checkbox
												id={item._id}
												checked={item.purchased}
												onCheckedChange={() =>
													handleToggle(item._id as Id<"shoppingListItems">)
												}
												className="border-gray-500 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
											/>
											<label
												htmlFor={item._id}
												className={`flex-1 text-sm cursor-pointer ${
													item.purchased
														? "line-through text-gray-500"
														: "text-white"
												}`}
											>
												{item.ingredientName}
											</label>
											<span className="text-gray-400 text-sm">
												{item.quantity} {item.unit}
											</span>
										</div>
									))}
								</CardContent>
							</Card>
						))}
				</div>
			)}

			{/* Footer actions */}
			<div className="flex gap-3 mt-6">
				<Link
					to="/meal-plans/$planId"
					params={{ planId: shoppingList.weeklyPlanId }}
					className="flex-1"
				>
					<Button
						variant="outline"
						className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
					>
						<ArrowLeft size={16} />
						Back to Plan
					</Button>
				</Link>
				<Button
					onClick={handleDelete}
					className="bg-red-700 hover:bg-red-800 text-white"
				>
					<Trash2 size={16} />
					Delete List
				</Button>
			</div>
		</div>
	);
}
