import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import {
	ArrowDown,
	ArrowUp,
	GripVertical,
	ImageIcon,
	Loader2,
	Plus,
	X,
} from "lucide-react";
import {
	useCallback,
	useId,
	useRef,
	useState,
	type KeyboardEvent,
} from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ── Types ──────────────────────────────────────────────────────────────────

export type StepDraft = {
	localId: string;
	id?: Id<"recipeSteps">;
	text: string;
	imageFile?: File;
	existingImageId?: Id<"_storage">;
	existingImageUrl?: string | null;
};

export type IngredientDraft = {
	localId: string;
	id?: Id<"recipeIngredients">;
	ingredientId: Id<"ingredients">;
	ingredientName: string;
	quantity: number;
	unitOverride: string;
	optional: boolean;
};

export type RecipeFormValues = {
	name: string;
	description: string;
	portions: number;
	cookTimeMinutes: number;
	difficulty: "easy" | "medium" | "hard";
	tags: string[];
	tips: string[];
	videoUrl: string;
	coverImageFile: File | null;
	existingCoverImageId?: Id<"_storage">;
	steps: StepDraft[];
	ingredients: IngredientDraft[];
};

type Props = {
	initialValues: RecipeFormValues;
	submitLabel: string;
	onSubmit: (values: RecipeFormValues) => Promise<void>;
	backTo: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

let _localIdCounter = 0;
const newLocalId = () => `local-${++_localIdCounter}`;

async function uploadFile(
	generateUrl: () => Promise<string>,
	file: File,
): Promise<Id<"_storage">> {
	const uploadUrl = await generateUrl();
	const response = await fetch(uploadUrl, {
		method: "POST",
		headers: { "Content-Type": file.type },
		body: file,
	});
	if (!response.ok) throw new Error("Image upload failed");
	const { storageId } = await response.json();
	return storageId as Id<"_storage">;
}

// ── Ingredient picker ──────────────────────────────────────────────────────

function IngredientPicker({
	onAdd,
}: {
	onAdd: (draft: Omit<IngredientDraft, "localId">) => void;
}) {
	const [search, setSearch] = useState("");
	const [quantity, setQuantity] = useState("1");
	const [unitOverride, setUnitOverride] = useState("");
	const [optional, setOptional] = useState(false);
	const [selected, setSelected] = useState<{
		id: Id<"ingredients">;
		name: string;
		allowedUnitIds: Id<"units">[];
		primaryUnitId: Id<"units">;
	} | null>(null);
	const [open, setOpen] = useState(false);

	const results = useQuery(api.ingredients.list, search ? { search } : {});
	const allUnits = useQuery(api.units.list, {});
	const searchId = useId();
	const quantityId = useId();
	const unitId = useId();
	const optionalId = useId();

	const availableUnits =
		selected && allUnits
			? allUnits.filter((u) => selected.allowedUnitIds.includes(u._id))
			: [];

	const handleAdd = () => {
		if (!selected || !quantity || Number(quantity) <= 0) return;
		onAdd({
			ingredientId: selected.id,
			ingredientName: selected.name,
			quantity: Number(quantity),
			unitOverride,
			optional,
		});
		setSelected(null);
		setSearch("");
		setQuantity("1");
		setUnitOverride("");
		setOptional(false);
		setOpen(false);
	};

	return (
		<div className="bg-slate-700 rounded-lg p-4 space-y-3">
			<div>
				<label
					htmlFor={searchId}
					className="block text-xs font-medium text-slate-300 mb-1"
				>
					Search ingredient
				</label>
				<div className="relative">
					<input
						id={searchId}
						type="text"
						value={selected ? selected.name : search}
						onChange={(e) => {
							setSearch(e.target.value);
							setSelected(null);
							setUnitOverride("");
							setOpen(true);
						}}
						onFocus={() => setOpen(true)}
						placeholder="e.g. flour"
						className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
					/>
					{open && results && results.length > 0 && !selected && (
						<ul className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-40 overflow-y-auto">
							{results.map((ing) => (
								<li key={ing._id}>
									<button
										type="button"
										onClick={() => {
											setSelected({
												id: ing._id,
												name: ing.name,
												allowedUnitIds: ing.allowedUnitIds,
												primaryUnitId: ing.primaryUnitId,
											});
											setSearch(ing.name);
											if (allUnits) {
												const primary = allUnits.find(
													(u) => u._id === ing.primaryUnitId,
												);
												if (primary) setUnitOverride(primary.abbreviation);
											}
											setOpen(false);
										}}
										className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm"
									>
										{ing.name}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<div className="flex gap-2">
				<div className="flex-1">
					<label
						htmlFor={quantityId}
						className="block text-xs font-medium text-slate-300 mb-1"
					>
						Quantity
					</label>
					<input
						id={quantityId}
						type="number"
						min="0.01"
						step="any"
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
						className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
					/>
				</div>
				<div className="flex-1">
					<label
						htmlFor={unitId}
						className="block text-xs font-medium text-slate-300 mb-1"
					>
						Unit
					</label>
					{selected && availableUnits.length > 0 ? (
						<select
							id={unitId}
							value={unitOverride}
							onChange={(e) => setUnitOverride(e.target.value)}
							className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
						>
							{availableUnits.map((u) => (
								<option key={u._id} value={u.abbreviation}>
									{u.abbreviation} ({u.name})
								</option>
							))}
						</select>
					) : (
						<input
							id={unitId}
							type="text"
							value={unitOverride}
							onChange={(e) => setUnitOverride(e.target.value)}
							placeholder="e.g. tbsp"
							disabled={!selected}
							className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm disabled:opacity-50"
						/>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<input
					id={optionalId}
					type="checkbox"
					checked={optional}
					onChange={(e) => setOptional(e.target.checked)}
					className="rounded border-slate-600 bg-slate-800"
				/>
				<label htmlFor={optionalId} className="text-xs text-slate-300">
					Optional ingredient
				</label>
			</div>

			<button
				type="button"
				onClick={handleAdd}
				disabled={!selected || !quantity || Number(quantity) <= 0}
				className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
			>
				<Plus size={14} />
				Add Ingredient
			</button>
		</div>
	);
}

// ── Sortable step item ─────────────────────────────────────────────────────

function SortableStepItem({
	step,
	index,
	total,
	onChange,
	onRemove,
	onMoveUp,
	onMoveDown,
}: {
	step: StepDraft;
	index: number;
	total: number;
	onChange: (localId: string, patch: Partial<StepDraft>) => void;
	onRemove: (localId: string) => void;
	onMoveUp: (localId: string) => void;
	onMoveDown: (localId: string) => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: step.localId });
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textId = useId();

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.altKey && e.key === "ArrowUp") {
			e.preventDefault();
			onMoveUp(step.localId);
		}
		if (e.altKey && e.key === "ArrowDown") {
			e.preventDefault();
			onMoveDown(step.localId);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: sortable step item needs keyboard reorder
		// biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label describes the sortable item
		<div
			ref={setNodeRef}
			style={style}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard reorder
			tabIndex={0}
			onKeyDown={handleKeyDown}
			aria-label={`Step ${index + 1}: ${step.text || "empty"}. Alt+Up/Down to reorder.`}
			className="bg-slate-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
		>
			<div className="flex items-start gap-3">
				{/* Drag handle */}
				<button
					type="button"
					{...attributes}
					{...listeners}
					className="mt-1 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing touch-none"
					aria-label="Drag to reorder step"
				>
					<GripVertical size={18} />
				</button>

				<div className="flex-1 space-y-2">
					<div className="flex items-center gap-2">
						<span className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
							{index + 1}
						</span>
						<label
							htmlFor={textId}
							className="text-xs font-medium text-slate-300"
						>
							Step text
						</label>
					</div>
					<textarea
						id={textId}
						value={step.text}
						onChange={(e) => onChange(step.localId, { text: e.target.value })}
						rows={2}
						placeholder="Describe this step..."
						className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm resize-none"
					/>

					{/* Image */}
					<div className="flex items-center gap-2">
						{(step.existingImageUrl || step.imageFile) && (
							<span className="text-xs text-slate-400 flex items-center gap-1">
								<ImageIcon size={12} />
								{step.imageFile ? step.imageFile.name : "Existing image"}
							</span>
						)}
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
						>
							<ImageIcon size={12} />
							{step.imageFile || step.existingImageId
								? "Change image"
								: "Add image"}
						</button>
						{(step.existingImageId || step.imageFile) && (
							<button
								type="button"
								onClick={() =>
									onChange(step.localId, {
										existingImageId: undefined,
										imageFile: undefined,
										existingImageUrl: null,
									})
								}
								className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
								title="Remove image"
							>
								<X size={12} />
							</button>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) onChange(step.localId, { imageFile: file });
							}}
						/>
					</div>
				</div>

				{/* Controls */}
				<div className="flex flex-col gap-1 shrink-0">
					<button
						type="button"
						onClick={() => onMoveUp(step.localId)}
						disabled={index === 0}
						className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
						title="Move up (Alt+↑)"
					>
						<ArrowUp size={14} />
					</button>
					<button
						type="button"
						onClick={() => onMoveDown(step.localId)}
						disabled={index === total - 1}
						className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
						title="Move down (Alt+↓)"
					>
						<ArrowDown size={14} />
					</button>
					<button
						type="button"
						onClick={() => onRemove(step.localId)}
						className="p-1 text-red-400 hover:text-red-300 transition-colors"
						title="Remove step"
					>
						<X size={14} />
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Main form ──────────────────────────────────────────────────────────────

export function RecipeForm({
	initialValues,
	submitLabel,
	onSubmit,
	backTo,
}: Props) {
	const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);

	const [values, setValues] = useState<RecipeFormValues>(initialValues);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Tag / tip inputs
	const [tagInput, setTagInput] = useState("");
	const [tipInput, setTipInput] = useState("");

	// Refs
	const coverInputRef = useRef<HTMLInputElement>(null);

	// IDs for accessibility
	const nameId = useId();
	const descriptionId = useId();
	const portionsId = useId();
	const cookTimeId = useId();
	const difficultyId = useId();
	const videoUrlId = useId();

	// ── DnD ──

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setValues((v) => {
			const oldIndex = v.steps.findIndex((s) => s.localId === active.id);
			const newIndex = v.steps.findIndex((s) => s.localId === over.id);
			return { ...v, steps: arrayMove(v.steps, oldIndex, newIndex) };
		});
	}, []);

	// ── Step helpers ──

	const addStep = () => {
		setValues((v) => ({
			...v,
			steps: [...v.steps, { localId: newLocalId(), text: "" }],
		}));
	};

	const updateStep = useCallback(
		(localId: string, patch: Partial<StepDraft>) => {
			setValues((v) => ({
				...v,
				steps: v.steps.map((s) =>
					s.localId === localId ? { ...s, ...patch } : s,
				),
			}));
		},
		[],
	);

	const removeStep = useCallback((localId: string) => {
		setValues((v) => ({
			...v,
			steps: v.steps.filter((s) => s.localId !== localId),
		}));
	}, []);

	const moveStep = useCallback((localId: string, direction: -1 | 1) => {
		setValues((v) => {
			const idx = v.steps.findIndex((s) => s.localId === localId);
			if (idx === -1) return v;
			const newIdx = idx + direction;
			if (newIdx < 0 || newIdx >= v.steps.length) return v;
			return { ...v, steps: arrayMove(v.steps, idx, newIdx) };
		});
	}, []);

	// ── Ingredient helpers ──

	const addIngredient = (draft: Omit<IngredientDraft, "localId">) => {
		setValues((v) => ({
			...v,
			ingredients: [...v.ingredients, { ...draft, localId: newLocalId() }],
		}));
	};

	const removeIngredient = (localId: string) => {
		setValues((v) => ({
			...v,
			ingredients: v.ingredients.filter((i) => i.localId !== localId),
		}));
	};

	// ── Tag / tip helpers ──

	const addTag = () => {
		const tag = tagInput.trim();
		if (!tag || values.tags.includes(tag)) return;
		setValues((v) => ({ ...v, tags: [...v.tags, tag] }));
		setTagInput("");
	};

	const removeTag = (tag: string) => {
		setValues((v) => ({ ...v, tags: v.tags.filter((t) => t !== tag) }));
	};

	const addTip = () => {
		const tip = tipInput.trim();
		if (!tip) return;
		setValues((v) => ({ ...v, tips: [...v.tips, tip] }));
		setTipInput("");
	};

	const removeTip = (i: number) => {
		setValues((v) => ({ ...v, tips: v.tips.filter((_, idx) => idx !== i) }));
	};

	// ── Submit ──

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			// Upload cover image if selected
			let finalValues = { ...values };
			if (values.coverImageFile) {
				const id = await uploadFile(
					() => generateUploadUrl({}),
					values.coverImageFile,
				);
				finalValues = {
					...finalValues,
					existingCoverImageId: id,
					coverImageFile: null,
				};
			}
			// Upload step images
			const stepsWithImages = await Promise.all(
				finalValues.steps.map(async (step) => {
					if (!step.imageFile) return step;
					const id = await uploadFile(
						() => generateUploadUrl({}),
						step.imageFile,
					);
					return { ...step, existingImageId: id, imageFile: undefined };
				}),
			);
			finalValues = { ...finalValues, steps: stepsWithImages };
			await onSubmit(finalValues);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred.");
			setSubmitting(false);
		}
	};

	// ── Render ──

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* ── Basic info ── */}
			<section className="space-y-4">
				<h2 className="text-lg font-semibold border-b border-slate-700 pb-2">
					Basic Info
				</h2>

				<div>
					<label
						htmlFor={nameId}
						className="block text-sm font-medium text-slate-300 mb-1"
					>
						Name *
					</label>
					<input
						id={nameId}
						type="text"
						value={values.name}
						onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
						required
						placeholder="e.g. Pasta Carbonara"
						className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
					/>
				</div>

				<div>
					<label
						htmlFor={descriptionId}
						className="block text-sm font-medium text-slate-300 mb-1"
					>
						Description
					</label>
					<textarea
						id={descriptionId}
						value={values.description}
						onChange={(e) =>
							setValues((v) => ({ ...v, description: e.target.value }))
						}
						rows={3}
						placeholder="A short description of the dish..."
						className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 resize-none"
					/>
				</div>

				<div className="grid grid-cols-3 gap-4">
					<div>
						<label
							htmlFor={portionsId}
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Portions *
						</label>
						<input
							id={portionsId}
							type="number"
							min="1"
							value={values.portions}
							onChange={(e) =>
								setValues((v) => ({ ...v, portions: Number(e.target.value) }))
							}
							required
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
						/>
					</div>
					<div>
						<label
							htmlFor={cookTimeId}
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Cook time (min) *
						</label>
						<input
							id={cookTimeId}
							type="number"
							min="1"
							value={values.cookTimeMinutes}
							onChange={(e) =>
								setValues((v) => ({
									...v,
									cookTimeMinutes: Number(e.target.value),
								}))
							}
							required
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
						/>
					</div>
					<div>
						<label
							htmlFor={difficultyId}
							className="block text-sm font-medium text-slate-300 mb-1"
						>
							Difficulty *
						</label>
						<select
							id={difficultyId}
							value={values.difficulty}
							onChange={(e) =>
								setValues((v) => ({
									...v,
									difficulty: e.target.value as "easy" | "medium" | "hard",
								}))
							}
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
						>
							<option value="easy">Easy</option>
							<option value="medium">Medium</option>
							<option value="hard">Hard</option>
						</select>
					</div>
				</div>

				<div>
					<label
						htmlFor={videoUrlId}
						className="block text-sm font-medium text-slate-300 mb-1"
					>
						Video URL (YouTube / Instagram / TikTok)
					</label>
					<input
						id={videoUrlId}
						type="url"
						value={values.videoUrl}
						onChange={(e) =>
							setValues((v) => ({ ...v, videoUrl: e.target.value }))
						}
						placeholder="https://youtube.com/watch?v=..."
						className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500"
					/>
				</div>
			</section>

			{/* ── Cover image ── */}
			<section className="space-y-3">
				<h2 className="text-lg font-semibold border-b border-slate-700 pb-2">
					Cover Image
				</h2>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => coverInputRef.current?.click()}
						className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
					>
						<ImageIcon size={14} />
						{values.coverImageFile
							? "Change cover image"
							: values.existingCoverImageId
								? "Replace cover image"
								: "Upload cover image"}
					</button>
					{values.coverImageFile && (
						<span className="text-sm text-slate-400">
							{values.coverImageFile.name}
						</span>
					)}
					{(values.coverImageFile || values.existingCoverImageId) && (
						<button
							type="button"
							onClick={() =>
								setValues((v) => ({
									...v,
									coverImageFile: null,
									existingCoverImageId: undefined,
								}))
							}
							className="text-red-400 hover:text-red-300"
						>
							<X size={14} />
						</button>
					)}
				</div>
				<input
					ref={coverInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) setValues((v) => ({ ...v, coverImageFile: file }));
					}}
				/>
			</section>

			{/* ── Tags ── */}
			<section className="space-y-3">
				<h2 className="text-lg font-semibold border-b border-slate-700 pb-2">
					Tags
				</h2>
				<div className="flex gap-2">
					<input
						type="text"
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
						placeholder="e.g. italian"
						className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
					/>
					<button
						type="button"
						onClick={addTag}
						className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
					>
						<Plus size={14} />
					</button>
				</div>
				{values.tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{values.tags.map((tag) => (
							<span
								key={tag}
								className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 rounded-full text-sm"
							>
								{tag}
								<button
									type="button"
									onClick={() => removeTag(tag)}
									className="text-slate-400 hover:text-white"
									aria-label={`Remove tag ${tag}`}
								>
									<X size={11} />
								</button>
							</span>
						))}
					</div>
				)}
			</section>

			{/* ── Tips ── */}
			<section className="space-y-3">
				<h2 className="text-lg font-semibold border-b border-slate-700 pb-2">
					Tips &amp; Tricks
				</h2>
				<div className="flex gap-2">
					<input
						type="text"
						value={tipInput}
						onChange={(e) => setTipInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTip();
							}
						}}
						placeholder="e.g. Use room-temperature eggs"
						className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
					/>
					<button
						type="button"
						onClick={addTip}
						className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
					>
						<Plus size={14} />
					</button>
				</div>
				{values.tips.length > 0 && (
					<ul className="space-y-2">
						{values.tips.map((tip, i) => (
							<li
								key={`${i}-${tip}`}
								className="flex items-start gap-2 p-3 bg-slate-800 rounded-lg text-sm"
							>
								<span className="text-amber-400 shrink-0 mt-0.5">•</span>
								<span className="flex-1">{tip}</span>
								<button
									type="button"
									onClick={() => removeTip(i)}
									className="text-slate-400 hover:text-red-400 shrink-0"
								>
									<X size={13} />
								</button>
							</li>
						))}
					</ul>
				)}
			</section>

			{/* ── Ingredients ── */}
			<section className="space-y-3">
				<h2 className="text-lg font-semibold border-b border-slate-700 pb-2">
					Ingredients
				</h2>
				{values.ingredients.length > 0 && (
					<ul className="space-y-2">
						{values.ingredients.map((ing) => (
							<li
								key={ing.localId}
								className="flex items-center justify-between p-3 bg-slate-800 rounded-lg text-sm"
							>
								<span className="font-medium flex items-center gap-2">
									{ing.ingredientName}
									{ing.optional && (
										<span className="px-1.5 py-0.5 bg-slate-600 text-slate-300 rounded text-xs">
											optional
										</span>
									)}
								</span>
								<div className="flex items-center gap-3">
									<span className="text-slate-400">
										{ing.quantity}
										{ing.unitOverride ? ` ${ing.unitOverride}` : ""}
									</span>
									<button
										type="button"
										onClick={() => removeIngredient(ing.localId)}
										className="text-red-400 hover:text-red-300"
									>
										<X size={14} />
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
				<IngredientPicker onAdd={addIngredient} />
			</section>

			{/* ── Steps ── */}
			<section className="space-y-3">
				<div className="flex items-center justify-between border-b border-slate-700 pb-2">
					<h2 className="text-lg font-semibold">Steps</h2>
					<span className="text-xs text-slate-400">
						Drag ✦ or Alt+↑↓ to reorder
					</span>
				</div>

				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={values.steps.map((s) => s.localId)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-3">
							{values.steps.map((step, idx) => (
								<SortableStepItem
									key={step.localId}
									step={step}
									index={idx}
									total={values.steps.length}
									onChange={updateStep}
									onRemove={removeStep}
									onMoveUp={(id) => moveStep(id, -1)}
									onMoveDown={(id) => moveStep(id, 1)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>

				<button
					type="button"
					onClick={addStep}
					className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors w-full justify-center"
				>
					<Plus size={16} />
					Add Step
				</button>
			</section>

			{/* ── Error / Submit ── */}
			{error && <p className="text-red-400 text-sm">{error}</p>}

			<div className="flex gap-3 pt-2">
				<button
					type="submit"
					disabled={submitting || !values.name.trim()}
					className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
				>
					{submitting && <Loader2 size={16} className="animate-spin" />}
					{submitLabel}
				</button>
				<a
					href={backTo}
					className="flex-1 py-2 text-center bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
				>
					Cancel
				</a>
			</div>
		</form>
	);
}
