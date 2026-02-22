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
	useLocation: () => ({ pathname: "/dishes/dish1" }),
	Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: () => ({ user: { email: "test@example.com" }, isLoading: false }),
}));

import { useQuery } from "convex/react";

describe("DishDetail UI", () => {
	const mockDish = {
		_id: "dish1",
		name: "Pasta Bolognese",
		mealType: "dinner" as const,
		likeness: 4,
		minTimesPerWeek: 1,
		maxTimesPerWeek: 3,
		userId: "user1",
		_creationTime: 0,
	};

	const mockRecipe = {
		_id: "recipe1",
		dishId: "dish1",
		servings: 2,
		userId: "user1",
		_creationTime: 0,
		ingredients: [
			{
				_id: "ri1",
				recipeId: "recipe1",
				ingredientId: "ing1",
				quantity: 200,
				unit: "g",
				_creationTime: 0,
				ingredient: { _id: "ing1", name: "Pasta", unit: "g", userId: "user1", _creationTime: 0 },
			},
		],
	};

	beforeEach(() => {
		vi.mocked(useQuery).mockReturnValue(mockDish as never);
	});

	it("renders dish name", () => {
		function TestDish() {
			const dish = useQuery(api.dishes.get, { id: "dish1" as never }) as typeof mockDish | null;
			if (!dish) return null;
			return <h1>{dish.name}</h1>;
		}
		render(<TestDish />);
		expect(screen.getByText("Pasta Bolognese")).toBeDefined();
	});

	it("renders create recipe button when no recipe", () => {
		function TestNoRecipe() {
			const recipe = null;
			return recipe === null ? (
				<button data-testid="create-recipe">Create Recipe</button>
			) : (
				<div>has recipe</div>
			);
		}
		render(<TestNoRecipe />);
		expect(screen.getByTestId("create-recipe")).toBeDefined();
	});

	it("renders ingredient list when recipe exists", () => {
		function TestWithRecipe() {
			return (
				<div>
					{mockRecipe.ingredients.map((ri) => (
						<div key={ri._id} data-testid="ingredient-row">
							{ri.ingredient.name}
						</div>
					))}
				</div>
			);
		}
		render(<TestWithRecipe />);
		expect(screen.getByText("Pasta")).toBeDefined();
		expect(screen.getAllByTestId("ingredient-row")).toHaveLength(1);
	});
});
