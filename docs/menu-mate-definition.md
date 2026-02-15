# Menu Mate Project Definition

## Overview

### Project Name

**Menu Mate** - Your AI-Powered Weekly Meal Planning Assistant

### Problem Statement

Meal planning is a time-consuming, repetitive task that creates decision fatigue. Home cooks face several challenges:

- Deciding what to cook each day requires significant mental energy
- Remembering favorite recipes and their ingredients is difficult
- Creating shopping lists is tedious and error-prone
- Tracking pantry inventory leads to food waste and duplicate purchases
- Balancing nutrition, preferences, and variety requires planning expertise

### Solution

Menu Mate is an intelligent meal planning application that learns your cooking habits and preferences to automate weekly menu creation. The system combines AI-powered recommendations with practical tools for recipe management, shopping list generation, and inventory tracking.

### Value Proposition

- **Save Time**: Reduce meal planning from hours to minutes with AI-assisted menu generation
- **Reduce Waste**: Track inventory and generate precise shopping lists to minimize food waste
- **Build Knowledge**: Centralize your cooking expertise, recipes, and preferences in one place
- **Learn & Adapt**: AI learns from your habits to suggest menus you'll actually cook
- **Collaborate**: Share meal planning responsibilities with household members

## Core Features

### Phase 1: Foundation (Current Focus)

#### Dish Library

- Save commonly cooked dishes with basic information (name, category, cuisine type)
- Tag dishes by meal type (breakfast, lunch, dinner, snack)
- Mark favorites and frequency preferences
- Quick search and filtering capabilities

#### Ingredient Management

- Create and maintain ingredient database
- Track ingredient details:
  - Name and aliases (e.g., "chicken breast" vs "pollo pechuga")
  - Current price and price history
  - Preferred supermarkets/stores
  - Unit measurements (kg, liters, units)
  - Shelf life and storage requirements
- Price comparison across stores
- Ingredient categorization (proteins, vegetables, grains, etc.)

#### Shopping List Generation

- Automatically generate shopping lists from selected menu items
- Group ingredients by category or store layout
- Check against current inventory to avoid duplicates
- Track purchased vs. needed quantities
- Mark items as purchased during shopping
- Support manual additions to lists

#### Inventory Tracking

- **Fridge Tracker**: Monitor perishable items and expiration dates
- **Freezer Tracker**: Track frozen items and freeze dates
- Quantity tracking with unit conversions
- Low-stock alerts for frequently used items
- Expiration warnings to reduce waste
- Quick add/remove interface for daily updates

### Phase 2: Intelligence (Medium Term)

#### AI Menu Planning

- Generate weekly menus based on:
  - Previously cooked dishes and frequency patterns
  - Seasonal ingredient availability
  - Nutritional balance requirements
  - Budget constraints
  - Time availability (quick weeknight meals vs. weekend cooking)
- Learn from user acceptance/rejection of suggestions
- Adapt to changing preferences over time
- Suggest variety while respecting comfort zone

#### Recipe Creation & Management

- Full recipe editor with:
  - Ingredient lists with quantities
  - Step-by-step cooking instructions
  - Preparation and cooking time estimates
  - Serving size adjustments
  - Photos and cooking tips
- Import recipes from external sources (URL, text)
- Rate and review recipes after cooking
- Notes field for personal modifications
- Version history for recipe iterations

#### Calorie & Nutrition Tracking

- Nutritional information per dish and ingredient
- Daily/weekly calorie summaries
- Macronutrient breakdown (proteins, carbs, fats)
- Dietary restriction support (vegetarian, vegan, gluten-free, etc.)
- Nutrition goal setting and tracking
- Allergen warnings and filtering

### Phase 3: Collaboration (Future)

#### Family & Household Sharing

- Multi-user household accounts
- Shared dish libraries and recipes
- Collaborative menu planning with voting/preferences
- Individual dietary preferences within household
- Responsibility assignment (who cooks what, who shops)

#### Permission Management

- Household admin roles
- Read-only sharing for family members
- Recipe contribution permissions
- Shopping list editing rights
- Privacy controls for personal notes/preferences

## User Experience

### Target Audience

**Primary Users:**

- Home cooks (beginner to advanced) who cook regularly
- Families seeking to streamline meal planning
- Individuals wanting to reduce food waste and save money
- Health-conscious users tracking nutrition

**User Characteristics:**

- Cook 4-7 days per week
- Struggle with "what's for dinner?" decision fatigue
- Want to balance variety, health, budget, and convenience
- Tech-comfortable but need intuitive interfaces
- Value time savings over complex features

### Key User Flows

#### First-Time Setup

1. Create account and authenticate (WorkOS)
2. Add 5-10 commonly cooked dishes (quick start)
3. Input frequently used ingredients with approximate prices
4. Set household preferences (dietary restrictions, favorite cuisines)
5. Optional: Initial fridge/freezer inventory

#### Weekly Menu Planning (Manual - Phase 1)

1. Review current inventory
2. Browse dish library and select meals for the week
3. Auto-generate shopping list from selections
4. Review and edit shopping list
5. Shop and mark items as purchased
6. Update inventory with new purchases

#### Weekly Menu Planning (AI-Assisted - Phase 2)

1. Review AI-suggested weekly menu
2. Accept, reject, or swap suggested dishes
3. System learns from choices
4. Auto-generate shopping list
5. Review optimized list (checks inventory, suggests substitutions)
6. Shop and update inventory

#### Daily Cooking Flow

1. Check today's menu item
2. View recipe details if needed
3. Verify ingredient availability
4. After cooking: rate the dish, add notes
5. Update inventory for consumed ingredients

### AI Learning from Habits

The AI system will learn and adapt based on:

- **Acceptance Patterns**: Which suggested dishes get cooked vs. rejected
- **Temporal Patterns**: Preferred dishes by day of week, season, or occasion
- **Ingredient Preferences**: Commonly used ingredients and combinations
- **Preparation Time**: Actual cooking times vs. planned times
- **Ratings & Feedback**: Dish ratings and user notes
- **Inventory Behavior**: Purchasing patterns and waste indicators

## Technical Approach

### Convex Schema Design Considerations

#### Core Tables

- **`users`**: WorkOS user profiles, household memberships, preferences
- **`households`**: Shared household entities, settings, permissions
- **`dishes`**: User's dish library (name, category, tags, frequency)
- **`recipes`**: Full recipe details linked to dishes
- **`ingredients`**: Master ingredient database (name, category, units)
- **`dishIngredients`**: Many-to-many relationship (dish → ingredients with quantities)
- **`prices`**: Ingredient price history by store
- **`stores`**: Supermarket/shop information
- **`menus`**: Weekly menu plans (week start date, household)
- **`menuItems`**: Individual menu entries (menu → dish → date/meal type)
- **`shoppingLists`**: Generated shopping lists
- **`shoppingListItems`**: Individual items with quantities, purchased status
- **`inventory`**: Current fridge/freezer contents
- **`inventoryItems`**: Individual items with quantities, locations, expiration dates

#### Indexes

- `dishes.userId` and `dishes.householdId` for filtering
- `ingredients.name` for search
- `prices.ingredientId` and `prices.storeId` for comparisons
- `menus.householdId` and `menus.weekStartDate` for calendar views
- `inventory.householdId` and `inventoryItems.location` for tracking

### AI Integration

**Approach Options:**

- OpenAI GPT-4 for natural language processing (recipe import, menu generation)
- Anthropic Claude for complex reasoning and preference learning
- Local models for privacy-sensitive operations
- Hybrid approach: lightweight local inference for real-time suggestions, cloud for complex planning

**Key AI Functions:**

- Menu generation based on constraints and history
- Recipe parsing from text/URLs
- Ingredient extraction and normalization
- Nutritional information estimation
- Smart substitution suggestions
- Conversational interface for meal planning

### Real-Time Sync Benefits (Convex)

- **Shared Shopping Lists**: Multiple household members can edit simultaneously
- **Inventory Updates**: Real-time sync when items are purchased or consumed
- **Menu Collaboration**: Live updates as family members vote or suggest changes
- **Cross-Device Sync**: Start planning on desktop, shop with mobile app

### Authentication & Permissions (WorkOS)

- **AuthKit Integration**: Seamless authentication flow
- **Organization Support**: Households as WorkOS organizations
- **Role-Based Access**: Admin, member, viewer roles for household features
- **SSO Ready**: Future integration with family identity providers

## Success Metrics

### User Efficiency

- **Time Saved**: Target 70% reduction in weekly meal planning time (from ~2 hours to ~20 minutes)
- **Planning Frequency**: Users who complete weekly menus consistently (target: 80% weekly active users)
- **Shopping Efficiency**: Reduction in shopping trips (consolidation from 2-3 trips to 1 trip per week)

### Food Waste Reduction

- **Inventory Turnover**: Percentage of purchased items consumed before expiration (target: >85%)
- **Waste Tracking**: Self-reported food waste reduction (target: 40% decrease)
- **Shopping Accuracy**: Items purchased vs. items actually used (target: >90% utilization)

### AI Learning Accuracy

- **Acceptance Rate**: Percentage of AI-suggested dishes that users accept (target: >60% in first month, >80% after 3 months)
- **Preference Alignment**: User satisfaction with menu variety and preferences (target: 4.5/5 rating)
- **Adaptation Speed**: Time to reach 80% acceptance rate (target: <6 weeks of active use)

### User Engagement

- **Recipe Library Growth**: Average dishes saved per active user (target: 30+ dishes after 3 months)
- **Feature Adoption**: Percentage using inventory tracking (target: >50%)
- **Retention**: 3-month active user retention (target: >60%)

### Business Metrics

- **User Acquisition Cost**: Cost per activated user (completed onboarding)
- **Lifetime Value**: Revenue per user over 12 months (subscription model)
- **Referral Rate**: Percentage of users inviting household members (target: >40%)
- **Premium Conversion**: Free to paid conversion rate for advanced AI features (target: >15%)

## Future Considerations

### Potential Integrations

- **Grocery Delivery APIs**: Instacart, Amazon Fresh, local delivery services
- **Smart Home Devices**: Sync with smart fridges, voice assistants
- **Nutrition Databases**: USDA FoodData Central, nutritional APIs
- **Recipe Platforms**: AllRecipes, Tasty, NYT Cooking imports

### Platform Expansion

- **Mobile Apps**: Native iOS/Android apps for on-the-go access
- **Voice Interface**: "Alexa, what's for dinner this week?"
- **Tablet Optimization**: Kitchen-friendly interface for cooking mode
- **Offline Support**: Core features available without internet

### Monetization Strategy

- **Freemium Model**:
  - Free: Basic dish library, manual menu planning, shopping lists
  - Premium: AI menu generation, advanced nutrition tracking, unlimited recipes
- **Household Plans**: Pricing tiers based on household size
- **Grocery Partnerships**: Affiliate revenue from shopping integrations

---

**Document Version**: 1.0
**Last Updated**: 2026-02-15
**Status**: Foundation Phase (Phase 1) in Progress
