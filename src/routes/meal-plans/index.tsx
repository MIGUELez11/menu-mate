import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { CalendarDays, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/meal-plans/")({
	ssr: false,
	component: MealPlansPage,
});

function MealPlansPage() {
	useUser();
	return (
		<>
			<Unauthenticated>
				<div className="p-8 text-white">Redirecting to sign in...</div>
			</Unauthenticated>
			<Authenticated>
				<MealPlansContent />
			</Authenticated>
		</>
	);
}

function MealPlansContent() {
	const plans = useQuery(api.weeklyPlans.list);
	const createPlan = useMutation(api.weeklyPlans.create);
	const removePlan = useMutation(api.weeklyPlans.remove);

	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [weekStartDate, setWeekStartDate] = useState("");

	const handleCreate = async () => {
		if (!weekStartDate) return;
		await createPlan({
			weekStartDate,
			name: name.trim() || undefined,
		});
		setName("");
		setWeekStartDate("");
		setOpen(false);
	};

	const handleRemove = async (id: Id<"weeklyPlans">) => {
		await removePlan({ id });
	};

	return (
		<div className="p-6 max-w-5xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-white">Meal Plans</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
							Create Plan
						</Button>
					</DialogTrigger>
					<DialogContent className="bg-gray-800 border-gray-700 text-white">
						<DialogHeader>
							<DialogTitle className="text-white">Create Meal Plan</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label className="text-gray-300">Week Start Date</Label>
								<Input
									type="date"
									value={weekStartDate}
									onChange={(e) => setWeekStartDate(e.target.value)}
									className="bg-gray-700 border-gray-600 text-white mt-1"
								/>
							</div>
							<div>
								<Label className="text-gray-300">Plan Name (optional)</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Feb Week 3"
									className="bg-gray-700 border-gray-600 text-white mt-1"
								/>
							</div>
							<Button
								onClick={handleCreate}
								disabled={!weekStartDate}
								className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
							>
								Create
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{!plans ? (
				<div className="text-gray-400">Loading...</div>
			) : plans.length === 0 ? (
				<div className="text-gray-400">No meal plans yet. Create one above.</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{plans.map((plan) => (
						<Card
							key={plan._id}
							className="bg-gray-800 border-gray-700 hover:border-cyan-700 transition-colors"
						>
							<CardHeader className="pb-2">
								<div className="flex items-start justify-between">
									<Link
										to="/meal-plans/$planId"
										params={{ planId: plan._id }}
										className="hover:text-cyan-400"
									>
										<CardTitle className="text-white text-lg">
											{plan.name ?? `Week of ${plan.weekStartDate}`}
										</CardTitle>
									</Link>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemove(plan._id)}
										className="text-red-400 hover:text-red-300 hover:bg-gray-700 -mt-1 -mr-2"
									>
										<Trash2 size={16} />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2 text-gray-400 text-sm">
									<CalendarDays size={14} />
									<span>{plan.weekStartDate}</span>
								</div>
								<div className="text-gray-400 text-sm mt-1">
									{plan.itemCount} item{plan.itemCount !== 1 ? "s" : ""}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
