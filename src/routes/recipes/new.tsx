import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { RecipeForm, type RecipeFormValues } from "../../components/RecipeForm";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/recipes/new")({
	ssr: false,
	component: NewRecipePage,
});

function NewRecipePage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to create a recipe.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<NewRecipeForm />
			</Authenticated>
		</>
	);
}

const EMPTY: RecipeFormValues = {
	name: "",
	description: "",
	portions: 2,
	cookTimeMinutes: 30,
	difficulty: "easy",
	tags: [],
	tips: [],
	videoUrl: "",
	coverImageFile: null,
	steps: [],
	ingredients: [],
};

function NewRecipeForm() {
	const navigate = useNavigate();
	const create = useMutation(api.recipes.create);
	const addIngredient = useMutation(api.recipes.addIngredient);
	const addStep = useMutation(api.recipes.addStep);

	const handleSubmit = async (values: RecipeFormValues) => {
		const recipeId = await create({
			name: values.name,
			description: values.description || undefined,
			portions: values.portions,
			cookTimeMinutes: values.cookTimeMinutes,
			difficulty: values.difficulty,
			tags: values.tags,
			tips: values.tips,
			videoUrl: values.videoUrl || undefined,
			coverImageId: values.existingCoverImageId,
		});

		for (const ing of values.ingredients) {
			await addIngredient({
				recipeId,
				ingredientId: ing.ingredientId,
				quantity: ing.quantity,
				unitOverride: ing.unitOverride || undefined,
			});
		}

		for (const step of values.steps) {
			await addStep({
				recipeId,
				text: step.text,
				imageId: step.existingImageId as Id<"_storage"> | undefined,
			});
		}

		await navigate({ to: "/recipes/$recipeId", params: { recipeId } });
	};

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-2xl mx-auto">
				<Link
					to="/recipes"
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Recipes
				</Link>

				<h1 className="text-2xl font-bold mb-6">New Recipe</h1>

				<RecipeForm
					initialValues={EMPTY}
					submitLabel="Create Recipe"
					onSubmit={handleSubmit}
					backTo="/recipes"
				/>
			</div>
		</div>
	);
}
