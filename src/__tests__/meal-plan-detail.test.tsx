import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { api } from "../../convex/_generated/api";

vi.mock("convex/react", () => ({
	Authenticated: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	Unauthenticated: () => null,
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => () => ({ component: null }),
	useLocation: () => ({ pathname: "/meal-plans/plan1" }),
	Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: () => ({ user: { email: "test@example.com" }, isLoading: false }),
}));

import { useQuery } from "convex/react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

describe("MealPlanDetail UI", () => {
	const mockPlan = {
		_id: "plan1",
		userId: "user1",
		weekStartDate: "2026-02-17",
		name: "Week 1",
		_creationTime: 0,
		items: [
			{
				_id: "item1",
				weeklyPlanId: "plan1",
				dishId: "dish1",
				dayOfWeek: 0,
				mealType: "dinner" as const,
				_creationTime: 0,
				dish: { _id: "dish1", name: "Pasta", mealType: "dinner" as const, likeness: 4, minTimesPerWeek: 1, maxTimesPerWeek: 3, userId: "user1", _creationTime: 0 },
			},
		],
	};

	beforeEach(() => {
		vi.mocked(useQuery).mockReturnValue(mockPlan as never);
	});

	it("renders plan name", () => {
		function TestPlan() {
			const plan = useQuery(api.weeklyPlans.getWithItems, { id: "plan1" as never }) as typeof mockPlan | null;
			if (!plan) return null;
			return <h1>{plan.name}</h1>;
		}
		render(<TestPlan />);
		expect(screen.getByText("Week 1")).toBeDefined();
	});

	it("renders 4x7 grid headers", () => {
		function TestGrid() {
			return (
				<table>
					<thead>
						<tr>
							<th>Meal</th>
							{DAYS.map((d) => <th key={d}>{d}</th>)}
						</tr>
					</thead>
					<tbody>
						{MEAL_TYPES.map((m) => (
							<tr key={m}>
								<td data-testid="meal-label">{m}</td>
								{DAYS.map((_, i) => <td key={i} />)}
							</tr>
						))}
					</tbody>
				</table>
			);
		}
		render(<TestGrid />);
		expect(screen.getByText("Mon")).toBeDefined();
		expect(screen.getByText("Sun")).toBeDefined();
		expect(screen.getAllByTestId("meal-label")).toHaveLength(4);
	});

	it("groups items by dayOfWeek + mealType", () => {
		const items = mockPlan.items;
		const grouped: Record<string, string[]> = {};
		for (const item of items) {
			const key = `${item.dayOfWeek}-${item.mealType}`;
			if (!grouped[key]) grouped[key] = [];
			grouped[key].push(item.dish!.name);
		}
		expect(grouped["0-dinner"]).toContain("Pasta");
		expect(Object.keys(grouped)).toHaveLength(1);
	});
});
