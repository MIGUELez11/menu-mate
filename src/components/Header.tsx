import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	BookOpen,
	ClipboardList,
	House,
	Menu,
	ShoppingBasket,
	X,
} from "lucide-react";

import WorkOSHeader from "./workos-user";

const navItems = [
	{ to: "/", label: "Home", icon: House },
	{ to: "/recipes", label: "Recipes", icon: BookOpen },
	{ to: "/meal-plans", label: "Meal Plans", icon: ClipboardList },
	{ to: "/shopping-list", label: "Shopping List", icon: ShoppingBasket },
] as const;

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 text-white backdrop-blur">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setIsOpen((open) => !open)}
						className="rounded-lg p-2 hover:bg-zinc-800"
						aria-label="Toggle menu"
					>
						{isOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
					<Link to="/" className="text-xl font-semibold tracking-tight">
						Menu Mate
					</Link>
				</div>
				<div className="hidden md:block">
					<WorkOSHeader />
				</div>
			</header>

			<aside
				className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-zinc-800 bg-zinc-900 p-4 text-white transition-transform duration-200 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="mt-12 space-y-2">
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.to}
								to={item.to}
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800"
								activeProps={{
									className:
										"flex items-center gap-3 rounded-lg bg-cyan-700 px-3 py-2",
								}}
							>
								<Icon size={18} />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</div>
				<div className="mt-6 border-t border-zinc-800 pt-4 md:hidden">
					<WorkOSHeader />
				</div>
			</aside>
		</>
	);
}
