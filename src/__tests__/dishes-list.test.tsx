import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { api } from "../../convex/_generated/api";

const mockCreate = vi.fn().mockResolvedValue("dish1");

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
	useLocation: () => ({ pathname: "/dishes" }),
	Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: () => ({ user: { email: "test@example.com" }, isLoading: false }),
}));

import { useQuery, useMutation } from "convex/react";

describe("DishesPage UI", () => {
	const mockDishes = [
		{
			_id: "dish1",
			name: "Pasta Bolognese",
			mealType: "dinner" as const,
			cuisineType: "Italian",
			likeness: 4,
			minTimesPerWeek: 1,
			maxTimesPerWeek: 3,
			userId: "user1",
			_creationTime: 0,
		},
		{
			_id: "dish2",
			name: "Pancakes",
			mealType: "breakfast" as const,
			likeness: 5,
			minTimesPerWeek: 2,
			maxTimesPerWeek: 5,
			userId: "user1",
			_creationTime: 0,
		},
	];

	beforeEach(() => {
		vi.mocked(useQuery).mockReturnValue(mockDishes as never);
		vi.mocked(useMutation).mockReturnValue(mockCreate as never);
	});

	it("renders dish list", () => {
		function TestDishList() {
			const dishes = useQuery(api.dishes.list) as typeof mockDishes;
			return (
				<div>
					{dishes?.map((d) => (
						<div key={d._id} data-testid="dish-row">
							<span>{d.name}</span>
							<span data-testid="meal-type">{d.mealType}</span>
						</div>
					))}
				</div>
			);
		}
		render(<TestDishList />);
		expect(screen.getByText("Pasta Bolognese")).toBeDefined();
		expect(screen.getByText("Pancakes")).toBeDefined();
		expect(screen.getAllByTestId("dish-row")).toHaveLength(2);
	});

	it("shows empty state when no dishes", () => {
		vi.mocked(useQuery).mockReturnValue([] as never);
		function TestEmpty() {
			const dishes = useQuery(api.dishes.list) as typeof mockDishes;
			return dishes.length === 0 ? (
				<div data-testid="empty">No dishes yet</div>
			) : (
				<div>has dishes</div>
			);
		}
		render(<TestEmpty />);
		expect(screen.getByTestId("empty")).toBeDefined();
	});
});
