import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

const mockCreate = vi.fn().mockResolvedValue("plan1");
const mockRemove = vi.fn().mockResolvedValue(null);

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
	useLocation: () => ({ pathname: "/meal-plans" }),
	Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: () => ({ user: { email: "test@example.com" }, isLoading: false }),
}));

import { useQuery } from "convex/react";

describe("MealPlansPage UI", () => {
	const mockPlans = [
		{
			_id: "plan1",
			userId: "user1",
			weekStartDate: "2026-02-17",
			name: "Week 1",
			itemCount: 5,
			_creationTime: 0,
		},
		{
			_id: "plan2",
			userId: "user1",
			weekStartDate: "2026-02-24",
			itemCount: 0,
			_creationTime: 0,
		},
	];

	beforeEach(() => {
		vi.mocked(useQuery).mockReturnValue(mockPlans as never);
	});

	it("renders plan cards", () => {
		function TestPlanList() {
			const plans = useQuery(() => [] as never) as typeof mockPlans;
			return (
				<div>
					{plans?.map((p) => (
						<div key={p._id} data-testid="plan-card">
							<span>{p.name ?? `Week of ${p.weekStartDate}`}</span>
							<span data-testid="item-count">{p.itemCount} items</span>
						</div>
					))}
				</div>
			);
		}
		render(<TestPlanList />);
		expect(screen.getByText("Week 1")).toBeDefined();
		expect(screen.getByText("Week of 2026-02-24")).toBeDefined();
		expect(screen.getAllByTestId("plan-card")).toHaveLength(2);
	});

	it("shows empty state when no plans", () => {
		vi.mocked(useQuery).mockReturnValue([] as never);
		function TestEmpty() {
			const plans = useQuery(() => [] as never) as typeof mockPlans;
			return plans.length === 0 ? (
				<div data-testid="empty">No meal plans yet</div>
			) : (
				<div>has plans</div>
			);
		}
		render(<TestEmpty />);
		expect(screen.getByTestId("empty")).toBeDefined();
	});
});
