# Menu Mate — Phase 1 Work Summary

## Overview

Built the core data layer, backend logic, UI pages, and tests for Menu Mate across three feature branches chained off each other. No destructive operations performed.

---

## Branches & PRs

| Branch | PR | Targets |
|---|---|---|
| `feature/dishes-and-recipes` | [#1](https://github.com/MIGUELez11/menu-mate/pull/1) | `main` |
| `feature/weekly-meal-plan` | [#2](https://github.com/MIGUELez11/menu-mate/pull/2) | `feature/dishes-and-recipes` |
| `feature/shopping-list` | [#3](https://github.com/MIGUELez11/menu-mate/pull/3) | `feature/weekly-meal-plan` |
| `chore/work-summary` | #4 | `feature/shopping-list` |

---

## Database Tables Added

| Table | Fields | Indexes |
|---|---|---|
| `ingredients` | name, unit, category?, userId | `by_user` |
| `dishes` | name, mealType, cuisineType?, likeness, minTimesPerWeek, maxTimesPerWeek, userId | `by_user` |
| `recipes` | dishId, servings, notes?, userId | `by_dish`, `by_user` |
| `recipeIngredients` | recipeId, ingredientId, quantity, unit | `by_recipe` |
| `weeklyPlans` | userId, weekStartDate, name? | `by_user` |
| `weeklyPlanItems` | weeklyPlanId, dishId, dayOfWeek, mealType | `by_plan` |
| `shoppingLists` | weeklyPlanId, userId | `by_plan` |
| `shoppingListItems` | shoppingListId, ingredientId, ingredientName, category?, quantity, unit, purchased | `by_list` |

---

## Features Built

### Branch 1: `feature/dishes-and-recipes`
- **Ingredients**: CRUD backend + `/ingredients` UI (table + inline add form)
- **Dishes**: CRUD backend (cascade delete to recipe + recipeIngredients) + `/dishes` UI (table with badges) + `/dishes/$dishId` detail (edit settings + recipe builder)
- **Recipes**: Full backend (create, add/remove/update ingredients, getByDish join)
- **Header**: Added Dishes + Ingredients nav links
- **Shadcn**: button, input, form, table, card, badge, select, dialog, label

### Branch 2: `feature/weekly-meal-plan`
- **Weekly Plans**: CRUD backend (cascade delete items, getWithItems join with itemCount) + `/meal-plans` card grid UI + `/meal-plans/$planId` 4×7 meal grid with dish chips
- **Header**: Added Meal Plans nav link

### Branch 3: `feature/shopping-list`
- **Shopping Lists**: `generate` mutation (aggregates recipe ingredients by ingredientId+unit, idempotent, skips dishes without recipes), getByPlan, getWithItems, togglePurchased, deleteList
- **UI**: `/shopping-lists/$listId` with progress bar, items grouped by category, checkbox rows with strikethrough
- **Meal Plan Detail**: Added "Generate Shopping List" + "View List" buttons
- **Shadcn**: checkbox, progress

---

## Test Results

| Scope | Tests |
|---|---|
| Convex backend | 33 tests |
| React UI | 16 tests |
| **Total** | **49 tests** |

All tests pass via `pnpm test`.

---

## Notes

- All mutations and queries have auth guards (`ctx.auth.getUserIdentity()`)
- React Compiler enabled; wrote idiomatic React with no manual memos except `useMemo` for grouping
- `src/routeTree.gen.ts` auto-updated by TanStack Router (not manually edited)
- No destructive git operations performed (no force push, reset --hard, etc.)
