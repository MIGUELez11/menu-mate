import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ExternalLink, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/dishes/")({
	ssr: false,
	component: DishesPage,
});

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealTypeColors: Record<MealType, string> = {
	breakfast: "bg-yellow-700 text-yellow-200",
	lunch: "bg-green-700 text-green-200",
	dinner: "bg-blue-700 text-blue-200",
	snack: "bg-purple-700 text-purple-200",
};

function DishesPage() {
	useUser();
	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-white">Redirecting to sign in...</div>
			</Unauthenticated>
			<Authenticated>
				<DishesContent />
			</Authenticated>
		</>
	);
}

function DishesContent() {
	const dishes = useQuery(api.dishes.list);
	const createDish = useMutation(api.dishes.create);
	const removeDish = useMutation(api.dishes.remove);

	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [mealType, setMealType] = useState<MealType>("dinner");
	const [cuisineType, setCuisineType] = useState("");
	const [likeness, setLikeness] = useState("3");
	const [minTimes, setMinTimes] = useState("1");
	const [maxTimes, setMaxTimes] = useState("3");

	const handleCreate = async () => {
		if (!name.trim()) return;
		await createDish({
			name: name.trim(),
			mealType,
			cuisineType: cuisineType.trim() || undefined,
			likeness: Number(likeness),
			minTimesPerWeek: Number(minTimes),
			maxTimesPerWeek: Number(maxTimes),
		});
		setName("");
		setCuisineType("");
		setLikeness("3");
		setMinTimes("1");
		setMaxTimes("3");
		setOpen(false);
	};

	const handleRemove = async (id: Id<"dishes">) => {
		await removeDish({ id });
	};

	return (
		<div className="p-6 max-w-5xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-white">Dishes</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
							Add Dish
						</Button>
					</DialogTrigger>
					<DialogContent className="bg-gray-800 border-gray-700 text-white">
						<DialogHeader>
							<DialogTitle className="text-white">Add New Dish</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label className="text-gray-300">Name</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="bg-gray-700 border-gray-600 text-white mt-1"
									placeholder="e.g. Pasta Bolognese"
								/>
							</div>
							<div>
								<Label className="text-gray-300">Meal Type</Label>
								<Select
									value={mealType}
									onValueChange={(v) => setMealType(v as MealType)}
								>
									<SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-gray-700 border-gray-600">
										{(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map(
											(t) => (
												<SelectItem key={t} value={t} className="text-white">
													{t.charAt(0).toUpperCase() + t.slice(1)}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label className="text-gray-300">Cuisine Type</Label>
								<Input
									value={cuisineType}
									onChange={(e) => setCuisineType(e.target.value)}
									className="bg-gray-700 border-gray-600 text-white mt-1"
									placeholder="e.g. Italian (optional)"
								/>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div>
									<Label className="text-gray-300">Likeness (1–5)</Label>
									<Input
										type="number"
										min={1}
										max={5}
										value={likeness}
										onChange={(e) => setLikeness(e.target.value)}
										className="bg-gray-700 border-gray-600 text-white mt-1"
									/>
								</div>
								<div>
									<Label className="text-gray-300">Min/week</Label>
									<Input
										type="number"
										min={0}
										value={minTimes}
										onChange={(e) => setMinTimes(e.target.value)}
										className="bg-gray-700 border-gray-600 text-white mt-1"
									/>
								</div>
								<div>
									<Label className="text-gray-300">Max/week</Label>
									<Input
										type="number"
										min={0}
										value={maxTimes}
										onChange={(e) => setMaxTimes(e.target.value)}
										className="bg-gray-700 border-gray-600 text-white mt-1"
									/>
								</div>
							</div>
							<Button
								onClick={handleCreate}
								disabled={!name.trim()}
								className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
							>
								Create Dish
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{!dishes ? (
				<div className="text-gray-400">Loading...</div>
			) : dishes.length === 0 ? (
				<div className="text-gray-400">No dishes yet. Add one above.</div>
			) : (
				<div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="border-gray-700 hover:bg-gray-800">
								<TableHead className="text-gray-400">Name</TableHead>
								<TableHead className="text-gray-400">Meal Type</TableHead>
								<TableHead className="text-gray-400">Cuisine</TableHead>
								<TableHead className="text-gray-400">Likeness</TableHead>
								<TableHead className="text-gray-400">Times/week</TableHead>
								<TableHead className="text-gray-400 w-20" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{dishes.map((dish) => (
								<TableRow
									key={dish._id}
									className="border-gray-700 hover:bg-gray-750"
								>
									<TableCell className="text-white font-medium">
										<Link
											to="/dishes/$dishId"
											params={{ dishId: dish._id }}
											className="flex items-center gap-1 hover:text-cyan-400"
										>
											{dish.name}
											<ExternalLink size={12} className="text-gray-500" />
										</Link>
									</TableCell>
									<TableCell>
										<Badge
											className={`${mealTypeColors[dish.mealType]} border-0 text-xs`}
										>
											{dish.mealType}
										</Badge>
									</TableCell>
									<TableCell className="text-gray-300">
										{dish.cuisineType ?? "—"}
									</TableCell>
									<TableCell>
										<span className="flex items-center gap-0.5 text-yellow-400">
											{Array.from({ length: dish.likeness }).map((_, i) => (
												<Star key={i} size={12} fill="currentColor" />
											))}
										</span>
									</TableCell>
									<TableCell className="text-gray-300">
										{dish.minTimesPerWeek}–{dish.maxTimesPerWeek}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleRemove(dish._id)}
											className="text-red-400 hover:text-red-300 hover:bg-gray-700"
										>
											<Trash2 size={16} />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
