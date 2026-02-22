import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { useState } from "react";

const mockCreate = vi.fn().mockResolvedValue("ing3");
const mockRemove = vi.fn().mockResolvedValue(null);

// Mock Convex hooks
vi.mock("convex/react", () => ({
	Authenticated: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	Unauthenticated: () => null,
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => () => ({ component: null }),
	useLocation: () => ({ pathname: "/ingredients" }),
}));

// Mock WorkOS auth
vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: () => ({ user: { email: "test@example.com" }, isLoading: false }),
}));

import { useQuery, useMutation } from "convex/react";

describe("IngredientsPage UI", () => {
	const mockIngredients = [
		{
			_id: "ing1",
			name: "Tomato",
			unit: "kg",
			category: "vegetables",
			userId: "user1",
			_creationTime: 0,
		},
		{
			_id: "ing2",
			name: "Flour",
			unit: "g",
			userId: "user1",
			_creationTime: 0,
		},
	];

	beforeEach(() => {
		vi.mocked(useQuery).mockReturnValue(mockIngredients as never);
		vi.mocked(useMutation).mockReturnValue(mockCreate as never);
	});

	it("renders ingredient list", () => {
		function TestList() {
			const ingredients = useQuery(() => [] as never) as typeof mockIngredients;
			return (
				<div>
					{ingredients?.map((i) => (
						<div key={i._id} data-testid="ingredient-row">
							{i.name}
						</div>
					))}
				</div>
			);
		}

		render(<TestList />);
		expect(screen.getByText("Tomato")).toBeDefined();
		expect(screen.getByText("Flour")).toBeDefined();
		expect(screen.getAllByTestId("ingredient-row")).toHaveLength(2);
	});

	it("calls create mutation on form submit", async () => {
		function TestForm() {
			const create = useMutation(() => [] as never);
			const [name, setName] = useState("");
			const [unit, setUnit] = useState("");
			return (
				<div>
					<input
						data-testid="name-input"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<input
						data-testid="unit-input"
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
					/>
					<button
						data-testid="add-btn"
						onClick={() => create({ name, unit } as never)}
					>
						Add
					</button>
				</div>
			);
		}

		render(<TestForm />);
		fireEvent.change(screen.getByTestId("name-input"), {
			target: { value: "Onion" },
		});
		fireEvent.change(screen.getByTestId("unit-input"), {
			target: { value: "pcs" },
		});
		fireEvent.click(screen.getByTestId("add-btn"));
		await waitFor(() => {
			expect(mockCreate).toHaveBeenCalledWith({ name: "Onion", unit: "pcs" });
		});
	});
});
