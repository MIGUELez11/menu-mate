import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { RecipeForm, type RecipeFormValues, type StepDraft, type IngredientDraft } from "../../../components/RecipeForm";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/recipes/$recipeId/edit")({
	ssr: false,
	component: EditRecipePage,
});

function EditRecipePage() {
	return (
		<>
			<Unauthenticated>
				<div className="min-h-screen bg-slate-900 flex items-center justify-center">
					<p className="text-white">Please sign in to edit recipes.</p>
				</div>
			</Unauthenticated>
			<Authenticated>
				<EditRecipeForm />
			</Authenticated>
		</>
	);
}

let _counter = 0;
const newLocalId = () => `edit-local-${++_counter}`;

function EditRecipeForm() {
	const { recipeId } = Route.useParams();
	const navigate = useNavigate();
	const recipe = useQuery(api.recipes.getById, {
		id: recipeId as Id<"recipes">,
	});

	const update = useMutation(api.recipes.update);
	const addIngredientMut = useMutation(api.recipes.addIngredient);
	const removeIngredientMut = useMutation(api.recipes.removeIngredient);
	const addStepMut = useMutation(api.recipes.addStep);
	const removeStepMut = useMutation(api.recipes.removeStep);
	const updateStepMut = useMutation(api.recipes.updateStep);
	const reorderStepsMut = useMutation(api.recipes.reorderSteps);

	const [initial, setInitial] = useState<RecipeFormValues | null>(null);

	useEffect(() => {
		if (!recipe || initial) return;
		const steps: StepDraft[] = recipe.steps.map((s) => ({
			localId: newLocalId(),
			id: s._id,
			text: s.text,
			existingImageId: s.imageId as Id<"_storage"> | undefined,
			existingImageUrl: s.imageUrl,
		}));
		const ingredients: IngredientDraft[] = recipe.ingredients.map((ri) => ({
			localId: newLocalId(),
			id: ri._id,
			ingredientId: ri.ingredientId,
			ingredientName: ri.ingredientName,
			quantity: ri.quantity,
			unitOverride: ri.unitOverride ?? "",
		}));
		setInitial({
			name: recipe.name,
			description: recipe.description ?? "",
			portions: recipe.portions,
			cookTimeMinutes: recipe.cookTimeMinutes,
			difficulty: recipe.difficulty,
			tags: [...recipe.tags],
			tips: [...recipe.tips],
			videoUrl: recipe.videoUrl ?? "",
			coverImageFile: null,
			existingCoverImageId: recipe.coverImageId as Id<"_storage"> | undefined,
			steps,
			ingredients,
		});
	}, [recipe, initial]);

	if (recipe === undefined || !initial) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Loading...</p>
			</div>
		);
	}

	if (recipe === null) {
		return (
			<div className="min-h-screen bg-slate-900 text-white p-6">
				<p className="text-slate-400">Recipe not found.</p>
			</div>
		);
	}

	const handleSubmit = async (values: RecipeFormValues) => {
		const id = recipeId as Id<"recipes">;

		// Update core recipe fields
		await update({
			id,
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

		// ── Ingredients: remove all existing, re-add ──
		for (const ing of recipe.ingredients) {
			await removeIngredientMut({ id: ing._id });
		}
		for (const ing of values.ingredients) {
			await addIngredientMut({
				recipeId: id,
				ingredientId: ing.ingredientId,
				quantity: ing.quantity,
				unitOverride: ing.unitOverride || undefined,
			});
		}

		// ── Steps: reconcile ──
		const existingIds = new Set(recipe.steps.map((s) => s._id));
		const keptIds = values.steps
			.filter((s) => s.id)
			.map((s) => s.id as Id<"recipeSteps">);
		const deletedIds = [...existingIds].filter((sid) => !keptIds.includes(sid));

		// Delete removed steps
		for (const sid of deletedIds) {
			await removeStepMut({ id: sid });
		}

		// Update existing steps / add new ones
		const newStepIds: Id<"recipeSteps">[] = [];
		for (const step of values.steps) {
			if (step.id) {
				await updateStepMut({
					id: step.id,
					text: step.text,
					imageId: step.existingImageId as Id<"_storage"> | undefined,
				});
				newStepIds.push(step.id);
			} else {
				const newId = await addStepMut({
					recipeId: id,
					text: step.text,
					imageId: step.existingImageId as Id<"_storage"> | undefined,
				});
				newStepIds.push(newId);
			}
		}

		// Reorder to match form order
		if (newStepIds.length > 0) {
			await reorderStepsMut({ recipeId: id, stepIds: newStepIds });
		}

		await navigate({ to: "/recipes/$recipeId", params: { recipeId } });
	};

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="max-w-2xl mx-auto">
				<Link
					to="/recipes/$recipeId"
					params={{ recipeId }}
					className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
				>
					<ArrowLeft size={18} />
					Back to Recipe
				</Link>

				<h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>

				<RecipeForm
					initialValues={initial}
					submitLabel="Save Changes"
					onSubmit={handleSubmit}
					backTo={`/recipes/${recipeId}`}
				/>
			</div>
		</div>
	);
}
