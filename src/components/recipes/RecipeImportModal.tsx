import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  List,
  Modal,
  Stack,
  Stepper,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIngredients } from '../../contexts/IngredientContext'
import { useRecipes } from '../../contexts/RecipeContext'
import { generateRecipeImportPrompt } from '../../utils/aiPromptGenerator'
import {
  validateRecipeImport,
  ValidationResult,
} from '../../utils/recipeImportValidator'

interface RecipeImportModalProps {
  opened: boolean
  onClose: () => void
}

export const RecipeImportModal = ({
  opened,
  onClose,
}: RecipeImportModalProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [importing, setImporting] = useState(false)

  const { ingredients, addIngredients } = useIngredients()
  const { addRecipe } = useRecipes()
  const navigate = useNavigate()

  // Generate the AI prompt with current ingredient library
  const prompt = generateRecipeImportPrompt(ingredients)

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const handleParse = () => {
    const result = validateRecipeImport(jsonInput, ingredients)
    setValidationResult(result)

    if (result.isValid) {
      // Auto-advance to review step
      setActiveStep(2)
    }
  }

  const handleImport = () => {
    if (!validationResult?.isValid || !validationResult.recipe) return

    setImporting(true)
    try {
      // Step 1: Add all new ingredients at once and get generated IDs
      const newIds = addIngredients(validationResult.newIngredients)

      // Step 2: Build ID mapping from placeholder IDs to generated IDs
      const idMapping: Record<string, string> = {}
      validationResult.newIngredients.forEach((ingredient, index) => {
        idMapping[ingredient.id] = newIds[index]
      })

      // Step 3: Update ingredient IDs in recipe to use generated IDs
      const { id: _id, ...recipeWithoutId } = validationResult.recipe
      const recipeWithMappedIds = {
        ...recipeWithoutId,
        ingredients: recipeWithoutId.ingredients.map(ing => ({
          ...ing,
          ingredientId: idMapping[ing.ingredientId] || ing.ingredientId,
        })),
      }

      // Step 4: Add recipe (addRecipe will generate and return recipe ID)
      const newRecipeId = addRecipe(recipeWithMappedIds)

      // Step 5: Navigate to recipe detail page with the generated ID
      navigate(`/recipes/${newRecipeId}`)

      // Close modal
      handleClose()
    } catch (error) {
      console.error('Failed to import recipe:', error)
      // Error will be shown in UI (could enhance with error state)
    } finally {
      setImporting(false)
    }
  }

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, 2))
  }

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  const handleClose = () => {
    setActiveStep(0)
    setCopied(false)
    setJsonInput('')
    setValidationResult(null)
    setImporting(false)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import Recipe with AI"
      size="xl"
    >
      <Stack gap="md">
        <Stepper active={activeStep} onStepClick={setActiveStep}>
          <Stepper.Step label="Generate Prompt">
            <Stack gap="md" mt="md">
              <Text size="sm">
                <strong>Step 1:</strong> Copy this prompt and paste it into your
                AI tool (ChatGPT, Claude, etc.)
              </Text>
              <Text size="sm">
                <strong>Step 2:</strong> In your next message to the AI, paste
                the recipe URL or recipe text
              </Text>
              <Textarea
                value={prompt}
                readOnly
                minRows={10}
                maxRows={15}
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  },
                }}
              />
              <Button
                variant="default"
                onClick={handleCopyPrompt}
                leftSection={
                  copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                }
              >
                {copied ? 'Copied!' : 'Copy Prompt'}
              </Button>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Paste Response">
            <Stack gap="md" mt="md">
              <Text size="sm">
                Paste the JSON response from your AI tool below.
              </Text>
              <Textarea
                placeholder="Paste JSON here..."
                minRows={6}
                value={jsonInput}
                onChange={e => setJsonInput(e.currentTarget.value)}
              />

              {validationResult && !validationResult.isValid && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Validation Errors"
                  color="red"
                >
                  <List size="sm">
                    {validationResult.errors.map((error, index) => (
                      <List.Item key={index}>{error}</List.Item>
                    ))}
                  </List>
                </Alert>
              )}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Review & Import">
            <Stack gap="md" mt="md">
              {validationResult?.isValid && validationResult.recipe ? (
                <>
                  <Title order={3}>{validationResult.recipe.name}</Title>
                  <Text size="sm">{validationResult.recipe.description}</Text>

                  <Group gap="md">
                    <Text size="sm">
                      <strong>Servings:</strong>{' '}
                      {validationResult.recipe.servings}
                    </Text>
                    <Text size="sm">
                      <strong>Time:</strong>{' '}
                      {validationResult.recipe.prepTime +
                        validationResult.recipe.cookTime}{' '}
                      min (Prep: {validationResult.recipe.prepTime}, Cook:{' '}
                      {validationResult.recipe.cookTime})
                    </Text>
                  </Group>

                  {validationResult.recipe.tags.length > 0 && (
                    <Group gap="xs">
                      {validationResult.recipe.tags.map((tag, index) => (
                        <Badge key={index} variant="light">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  )}

                  <Divider />

                  <div>
                    <Text size="sm" fw={700} mb="xs">
                      Ingredients ({validationResult.recipe.ingredients.length})
                    </Text>
                    <List size="sm">
                      {validationResult.recipe.ingredients.map((ing, index) => {
                        // First check existing ingredients
                        let ingredient = ingredients.find(
                          i => i.id === ing.ingredientId
                        )
                        let isNew = false

                        // If not found in existing, check new ingredients
                        if (!ingredient) {
                          ingredient = validationResult.newIngredients.find(
                            newIng => newIng.id === ing.ingredientId
                          )
                          isNew = !!ingredient
                        }

                        // Format ingredient display with displayName if present
                        const ingredientName = ingredient?.name || 'Unknown'
                        const displayText = ing.displayName
                          ? `${ing.displayName} (${ingredientName})`
                          : ingredientName

                        return (
                          <List.Item key={index}>
                            {ing.quantity} {ing.unit} {displayText}
                            {isNew && (
                              <Badge size="xs" color="blue" ml="xs">
                                New
                              </Badge>
                            )}
                          </List.Item>
                        )
                      })}
                    </List>
                  </div>

                  <Divider />

                  <div>
                    <Text size="sm" fw={700} mb="xs">
                      Instructions
                    </Text>
                    <List size="sm" type="ordered">
                      {validationResult.recipe.instructions.map(
                        (instruction, index) => (
                          <List.Item key={index}>{instruction}</List.Item>
                        )
                      )}
                    </List>
                  </div>
                </>
              ) : (
                <Text size="sm" c="dimmed">
                  Recipe preview will appear here after parsing...
                </Text>
              )}
            </Stack>
          </Stepper.Step>
        </Stepper>

        {/* Navigation buttons */}
        <Group justify="space-between" mt="xl">
          <Button
            variant="default"
            onClick={handleBack}
            disabled={activeStep === 0}
            style={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </Button>

          {activeStep === 0 && (
            <Button onClick={handleNext}>Next - I have the AI response</Button>
          )}
          {activeStep === 1 && (
            <Button
              onClick={() => {
                if (!validationResult) {
                  // First click: validate the JSON
                  handleParse()
                } else if (validationResult.isValid) {
                  // Already validated and valid: proceed to next step
                  handleNext()
                }
              }}
              disabled={!jsonInput.trim()}
            >
              {validationResult?.isValid
                ? 'Next - Review recipe'
                : 'Validate JSON'}
            </Button>
          )}
          {activeStep === 2 && (
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={!validationResult?.isValid}
            >
              Import Recipe
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}
