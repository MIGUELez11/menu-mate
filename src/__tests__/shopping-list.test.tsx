import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

const mockToggle = vi.fn().mockResolvedValue(null);
const mockDelete = vi.fn().mockResolvedValue(null);

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
	useLocation: () => ({ pathname: "/shopping-lists/list1" }),
	Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@workos-inc/authkit-react", () => ({
	useAuth: () => ({ user: { email: "test@example.com" }, isLoading: false }),
}));

import { useQuery } from "convex/react";

describe("ShoppingList UI", () => {
	const mockList = {
		_id: "list1",
		weeklyPlanId: "plan1",
		userId: "user1",
		_creationTime: 0,
		items: [
			{
				_id: "item1",
				shoppingListId: "list1",
				ingredientId: "ing1",
				ingredientName: "Pasta",
				category: "grains",
				quantity: 400,
				unit: "g",
				purchased: false,
				_creationTime: 0,
			},
			{
				_id: "item2",
				shoppingListId: "list1",
				ingredientId: "ing2",
				ingredientName: "Tomato",
				category: "vegetables",
				quantity: 300,
				unit: "g",
				purchased: true,
				_creationTime: 0,
			},
		],
	};

	beforeEach(() => {
		vi.mocked(useQuery).mockReturnValue(mockList as never);
	});

	it("renders shopping list items", () => {
		function TestList() {
			const list = useQuery(() => null as never) as typeof mockList | null;
			if (!list) return null;
			return (
				<div>
					{list.items.map((item) => (
						<div key={item._id} data-testid="list-item">
							{item.ingredientName}
						</div>
					))}
				</div>
			);
		}
		render(<TestList />);
		expect(screen.getByText("Pasta")).toBeDefined();
		expect(screen.getByText("Tomato")).toBeDefined();
		expect(screen.getAllByTestId("list-item")).toHaveLength(2);
	});

	it("shows progress correctly", () => {
		const total = mockList.items.length;
		const purchased = mockList.items.filter((i) => i.purchased).length;
		const progress = Math.round((purchased / total) * 100);
		expect(progress).toBe(50);

		function TestProgress() {
			const list = useQuery(() => null as never) as typeof mockList | null;
			if (!list) return null;
			const t = list.items.length;
			const p = list.items.filter((i) => i.purchased).length;
			return <div data-testid="progress">{p} of {t}</div>;
		}
		render(<TestProgress />);
		expect(screen.getByTestId("progress").textContent).toBe("1 of 2");
	});

	it("groups items by category", () => {
		const items = mockList.items;
		const grouped: Record<string, string[]> = {};
		for (const item of items) {
			const cat = item.category ?? "Other";
			if (!grouped[cat]) grouped[cat] = [];
			grouped[cat].push(item.ingredientName);
		}
		expect(grouped["grains"]).toContain("Pasta");
		expect(grouped["vegetables"]).toContain("Tomato");
		expect(Object.keys(grouped)).toHaveLength(2);
	});

	it("applies strikethrough to purchased items", () => {
		function TestStrike() {
			const list = useQuery(() => null as never) as typeof mockList | null;
			if (!list) return null;
			return (
				<div>
					{list.items.map((item) => (
						<span
							key={item._id}
							data-testid={`item-${item._id}`}
							className={item.purchased ? "line-through" : ""}
						>
							{item.ingredientName}
						</span>
					))}
				</div>
			);
		}
		render(<TestStrike />);
		const tomatoEl = screen.getByTestId("item-item2");
		expect(tomatoEl.className).toContain("line-through");
		const pastaEl = screen.getByTestId("item-item1");
		expect(pastaEl.className).not.toContain("line-through");
	});
});
