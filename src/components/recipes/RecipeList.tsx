import { Recipe } from '../../types/recipe'

interface RecipeListProps {
  recipes: Recipe[]
  onEdit: (recipeId: string) => void
  onDelete: (recipeId: string) => void
  onView: (recipeId: string) => void
  onCreate?: () => void
}

export function RecipeList({
  recipes,
  onEdit,
  onDelete,
  onView,
  onCreate,
}: RecipeListProps) {
  // Empty state
  if (recipes.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-700">
            No Recipes Yet
          </h2>
          <p className="mb-6 text-gray-500">
            Create your first recipe to get started!
          </p>
          {onCreate && (
            <button
              onClick={onCreate}
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Your First Recipe
            </button>
          )}
        </div>
      </div>
    )
  }

  // Recipe cards grid
  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      {recipes.map(recipe => (
        <div
          key={recipe.id}
          onClick={() => onView(recipe.id)}
          className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          {/* Recipe Name */}
          <h3 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-blue-600">
            {recipe.name}
          </h3>

          {/* Description - truncated to 3 lines */}
          <p className="mb-4 line-clamp-3 text-sm text-gray-600">
            {recipe.description}
          </p>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {recipe.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta Info */}
          <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span aria-label="servings">👤</span>
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center gap-1">
              <span aria-label="time">⏱</span>
              <span>{recipe.totalTime} min</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={e => {
                e.stopPropagation()
                onView(recipe.id)
              }}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`View ${recipe.name}`}
            >
              View
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                onEdit(recipe.id)
              }}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Edit ${recipe.name}`}
            >
              Edit
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                onDelete(recipe.id)
              }}
              className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={`Delete ${recipe.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
