export enum IngredientCategory {
  Produce = 'produce',
  Dairy = 'dairy',
  Meat = 'meat',
  Pantry = 'pantry',
  Frozen = 'frozen',
  Bakery = 'bakery',
  Other = 'other'
}

export interface IngredientItem {
  id: string;
  name: string;
  category: IngredientCategory;
  standardUnit: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings: number;
  totalTime: number; // in minutes
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
