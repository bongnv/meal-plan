import { Box, Button, Group, Modal, Stack, Text, Title } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { mealPlanService } from '@/services/mealPlanService'

import { CopyMealPlanModal } from './CopyMealPlanModal'
import { DroppableDayCard } from './DroppableDayCard'

import type { MealPlan } from '@/types/mealPlan'
import type { Recipe } from '@/types/recipe'

interface MealPlansListProps {
  mealPlans: MealPlan[]
  getRecipeById: (id: string) => Recipe | undefined
  onAddMeal: (params: { date: string }) => void
  onDeleteMeal?: (mealPlan: MealPlan) => void
}

type QuickFilterType = 'today' | 'nextweek' | 'custom'

export function MealPlansList({
  mealPlans,
  getRecipeById,
  onAddMeal,
  onDeleteMeal,
}: MealPlansListProps) {
  // Memoize today's date string to ensure it's stable across renders
  const todayString = useMemo(() => {
    return mealPlanService.getLocalDateString(new Date())
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('today')
  const [deleteConfirmation, setDeleteConfirmation] = useState<MealPlan | null>(
    null
  )
  const [copyModalOpened, setCopyModalOpened] = useState(false)
  const [selectedMealForCopy, setSelectedMealForCopy] =
    useState<MealPlan | null>(null)

  // Get date range based on filter (always 7 days from starting date)
  const dateRange = mealPlanService.calculateDateRange(
    quickFilter,
    selectedDate
  )

  // Generate all days in range (including empty days)
  const daysInRange = useMemo(() => {
    return mealPlanService.generateDateRange(dateRange.start, dateRange.end)
  }, [dateRange.start, dateRange.end])

  // Group meals by date (including empty dates)
  const groupedMeals = useMemo(() => {
    return mealPlanService.groupMealsByDate(mealPlans, daysInRange)
  }, [daysInRange, mealPlans])

  const handleDeleteConfirm = () => {
    if (deleteConfirmation && onDeleteMeal) {
      onDeleteMeal(deleteConfirmation)
      setDeleteConfirmation(null)
    }
  }

  const handleQuickFilter = (filter: QuickFilterType) => {
    setQuickFilter(filter)
    if (filter !== 'custom') {
      setSelectedDate(null)
    }
  }

  const handleDateChange = (value: string | null) => {
    if (value) {
      setSelectedDate(new Date(value))
      setQuickFilter('custom')
    } else {
      setSelectedDate(null)
    }
  }

  return (
    <Stack
      gap="md"
      role="region"
      aria-label="Meal Plans List"
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {/* Header with date picker and quick filters */}
      <Stack gap="md" style={{ flexShrink: 0 }}>
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <DatePickerInput
            value={selectedDate}
            onChange={handleDateChange}
            placeholder="Pick a date"
            leftSection={<IconCalendar size={18} />}
            clearable
            style={{ minWidth: 200 }}
          />

          <Group gap="xs">
            <Button
              variant={quickFilter === 'today' ? 'filled' : 'default'}
              size="sm"
              onClick={() => handleQuickFilter('today')}
            >
              This Week
            </Button>
            <Button
              variant={quickFilter === 'nextweek' ? 'filled' : 'default'}
              size="sm"
              onClick={() => handleQuickFilter('nextweek')}
            >
              Next Week
            </Button>
          </Group>
        </Group>
      </Stack>

      {/* List View */}
      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Stack gap="md" pb="md">
          {groupedMeals.length === 0 ? (
            <Box p="xl" style={{ textAlign: 'center' }}>
              <Text size="lg" c="dimmed" mb="md">
                No meals planned yet
              </Text>
              <Button
                onClick={() =>
                  onAddMeal({
                    date: mealPlanService.getLocalDateString(new Date()),
                  })
                }
              >
                Add Your First Meal
              </Button>
            </Box>
          ) : (
            groupedMeals.map(group => {
              const isToday = group.date === todayString

              return (
                <Box key={group.date}>
                  <Title
                    order={3}
                    size="h4"
                    mb="sm"
                    style={{
                      color: isToday
                        ? 'var(--mantine-color-blue-6)'
                        : undefined,
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {mealPlanService.formatLongDate(group.date)}
                  </Title>

                  <DroppableDayCard
                    dateString={group.date}
                    meals={group.meals}
                    getRecipeById={getRecipeById}
                    onAddMeal={onAddMeal}
                    onCopyMeal={meal => {
                      setSelectedMealForCopy(meal)
                      setCopyModalOpened(true)
                    }}
                    onDeleteMeal={meal => setDeleteConfirmation(meal)}
                  />
                </Box>
              )
            })
          )}
        </Stack>
      </Box>

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
            <Button
              variant="default"
              onClick={() => setDeleteConfirmation(null)}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Copy meal plan modal */}
      {selectedMealForCopy && (
        <CopyMealPlanModal
          opened={copyModalOpened}
          onClose={() => {
            setCopyModalOpened(false)
            setSelectedMealForCopy(null)
          }}
          mealPlanId={selectedMealForCopy.id}
        />
      )}
    </Stack>
  )
}
