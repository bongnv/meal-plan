import { useEffect, useMemo, useRef, useState } from 'react'

import { ActionIcon, Badge, Box, Button, Card, Group, Modal, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { IconChevronLeft, IconChevronRight, IconEdit, IconTrash } from '@tabler/icons-react'

import { DroppableMealSlot } from './DroppableMealSlot'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface CalendarViewProps {
  mealPlans: MealPlan[]
  getRecipeById: (id: string) => Recipe | undefined
  onAddMeal: (params: { date: string }) => void
  onEditMeal: (mealPlan: MealPlan) => void
  onDeleteMeal?: (mealPlan: MealPlan) => void
}

interface DayData {
  date: Date
  dateString: string
  isToday: boolean
  isCurrentMonth: boolean
}

type ViewMode = 'month' | 'list'

export function CalendarView({ mealPlans, getRecipeById, onAddMeal, onEditMeal, onDeleteMeal }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [deleteConfirmation, setDeleteConfirmation] = useState<MealPlan | null>(null)
  const listScrollRef = useRef<HTMLDivElement>(null)
  const todayDateRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Get days to display (month view only)
  const getDaysToDisplay = (): DayData[] => {
    const days: DayData[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Month view: show full month grid
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Start from the Sunday before the first day of the month
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
    
    // End on the Saturday after the last day of the month
    const endDate = new Date(lastDayOfMonth)
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0]
      days.push({
        date: new Date(date),
        dateString,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      })
    }
    
    return days
  }

  const days = getDaysToDisplay()

  // Get meals for a specific date and meal type
  const getMealsForSlot = (dateString: string, mealType: MealType): MealPlan | undefined => {
    return mealPlans.find(mp => mp.date === dateString && mp.mealType === mealType)
  }

  // Navigate to previous month
  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  // Navigate to next month
  const handleNext = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Format month/year header
  const getHeaderText = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
    return currentDate.toLocaleDateString('en-US', options)
  }

  // Get grouped meals for list view
  const groupedMealsForList = useMemo(() => {
    const sorted = [...mealPlans].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB
      return a.mealType === 'lunch' ? -1 : 1
    })

    const grouped: Array<{ date: string; meals: MealPlan[] }> = []
    sorted.forEach((meal) => {
      const existing = grouped.find((g) => g.date === meal.date)
      if (existing) {
        existing.meals.push(meal)
      } else {
        grouped.push({ date: meal.date, meals: [meal] })
      }
    })
    return grouped
  }, [mealPlans])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmation && onDeleteMeal) {
      onDeleteMeal(deleteConfirmation)
      setDeleteConfirmation(null)
    }
  }

  // Scroll to today when currentDate changes in list view
  useEffect(() => {
    if (viewMode === 'list') {
      const todayString = currentDate.toISOString().split('T')[0]
      const todayElement = todayDateRefs.current.get(todayString)
      
      if (todayElement && listScrollRef.current) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          todayElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
      }
    }
  }, [currentDate, viewMode])

  return (
    <Stack gap="md" role="region" aria-label="Calendar">
      {/* Header with navigation and view switcher */}
      <Group justify="space-between">
        <Title order={2}>{getHeaderText()}</Title>
        
        <Group gap="xs">
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            data={[
              { label: 'Month', value: 'month' },
              { label: 'List', value: 'list' },
            ]}
            size="sm"
          />

          <Button onClick={handleToday} variant="default" size="sm">
            Today
          </Button>
          
          <ActionIcon onClick={handlePrevious} variant="default" aria-label="Previous">
            <IconChevronLeft size={18} />
          </ActionIcon>
          
          <ActionIcon onClick={handleNext} variant="default" aria-label="Next">
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Conditional rendering based on view mode */}
      {viewMode === 'month' ? (
        <>
          {/* Day headers */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} ta="center" size="sm" fw={600} c="dimmed">
                {day}
              </Text>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
            role="grid"
          >
            {days.map(({ date, dateString, isToday, isCurrentMonth }) => {
              const lunchMeal = getMealsForSlot(dateString, 'lunch')
              const dinnerMeal = getMealsForSlot(dateString, 'dinner')

              return (
                <Paper
                  key={dateString}
                  p="xs"
                  withBorder
                  role="gridcell"
                  style={{
                    minHeight: '120px',
                    opacity: isCurrentMonth ? 1 : 0.5,
                    backgroundColor: isToday ? 'var(--mantine-color-blue-0)' : undefined,
                  }}
                >
                  <Stack gap="xs">
                    <Text
                      size="sm"
                      fw={isToday ? 700 : 400}
                      c={isToday ? 'blue' : undefined}
                      data-today={isToday}
                    >
                      {date.getDate()}
                    </Text>

                    <Stack gap={4}>
                      {/* Only show meals that exist, or show add button if both empty */}
                      {!lunchMeal && !dinnerMeal ? (
                        <DroppableMealSlot
                          dateString={dateString}
                          mealType="lunch"
                          meal={undefined}
                          getRecipeById={getRecipeById}
                          onAddMeal={onAddMeal}
                          onEditMeal={onEditMeal}
                        />
                      ) : (
                        <>
                          {lunchMeal && (
                            <Box>
                              <Group justify="space-between" wrap="nowrap" gap={4}>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <DroppableMealSlot
                                    dateString={dateString}
                                    mealType="lunch"
                                    meal={lunchMeal}
                                    getRecipeById={getRecipeById}
                                    onAddMeal={onAddMeal}
                                    onEditMeal={onEditMeal}
                                  />
                                </Box>
                                <ActionIcon
                                  variant="subtle"
                                  size="xs"
                                  color="blue"
                                  onClick={() => onEditMeal(lunchMeal)}
                                  aria-label="Edit"
                                  style={{ flexShrink: 0 }}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Group>
                            </Box>
                          )}
                          {dinnerMeal && (
                            <Box>
                              <Group justify="space-between" wrap="nowrap" gap={4}>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <DroppableMealSlot
                                    dateString={dateString}
                                    mealType="dinner"
                                    meal={dinnerMeal}
                                    getRecipeById={getRecipeById}
                                    onAddMeal={onAddMeal}
                                    onEditMeal={onEditMeal}
                                  />
                                </Box>
                                <ActionIcon
                                  variant="subtle"
                                  size="xs"
                                  color="blue"
                                  onClick={() => onEditMeal(dinnerMeal)}
                                  aria-label="Edit"
                                  style={{ flexShrink: 0 }}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Group>
                            </Box>
                          )}
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              )
            })}
          </Box>
        </>
      ) : (
        /* List/Agenda View with dynamic height */
        <Box 
          ref={listScrollRef}
          style={{ 
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <Stack gap="md" pb="md">
            {groupedMealsForList.length === 0 ? (
              <Box p="xl" style={{ textAlign: 'center' }}>
                <Text size="lg" c="dimmed" mb="md">
                  No meals planned yet
                </Text>
                <Button onClick={() => onAddMeal({ date: new Date().toISOString().split('T')[0] })}>
                  Add Your First Meal
                </Button>
              </Box>
            ) : (
              groupedMealsForList.map((group) => {
                const today = new Date().toISOString().split('T')[0]
                const isToday = group.date === today
                
                return (
                  <Box 
                    key={group.date}
                    ref={(el) => {
                      if (el) todayDateRefs.current.set(group.date, el)
                    }}
                  >
                    <Title 
                      order={3} 
                      size="h4" 
                      mb="sm"
                      style={{
                        color: isToday ? 'var(--mantine-color-blue-6)' : undefined,
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {formatDate(group.date)}
                    </Title>
                  <Stack gap="sm">
                    {group.meals.map((meal) => {
                      const isRecipe = meal.type === 'recipe'
                      
                      return (
                        <Card key={meal.id} shadow="sm" padding="md" withBorder>
                          <Stack gap="sm">
                            <Group justify="space-between" wrap="nowrap">
                              <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
                                <Text size="xl" style={{ flexShrink: 0 }}>
                                  {meal.mealType === 'lunch' ? '🥗' : '🍽️'}
                                </Text>
                                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                                  <Group gap="xs" wrap="wrap">
                                    <Badge variant="light" size="sm">
                                      {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                                    </Badge>
                                  </Group>
                                  <DroppableMealSlot
                                    dateString={meal.date}
                                    mealType={meal.mealType}
                                    meal={meal}
                                    getRecipeById={getRecipeById}
                                    onAddMeal={onAddMeal}
                                    onEditMeal={onEditMeal}
                                  />
                                  {isRecipe && 'servings' in meal && (
                                    <Text size="sm" c="dimmed">
                                      {meal.servings} servings
                                    </Text>
                                  )}
                                </Stack>
                              </Group>
                              <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                                <ActionIcon
                                  variant="subtle"
                                  color="blue"
                                  onClick={() => onEditMeal(meal)}
                                  aria-label="Edit"
                                >
                                  <IconEdit size={18} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() => setDeleteConfirmation(meal)}
                                  aria-label="Delete"
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Stack>
                        </Card>
                      )
                    })}
                  </Stack>
                </Box>
                )
              })
            )}
          </Stack>
        </Box>
      )}

      {/* Delete confirmation modal */}
      <Modal
        opened={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        title="Delete Meal"
        centered
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete this meal?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteConfirmation(null)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
