import {
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { CopyMealPlanModal } from './CopyMealPlanModal'
import { DroppableDayCard } from './DroppableDayCard'

import type { MealPlan } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

interface CalendarViewProps {
  mealPlans: MealPlan[]
  getRecipeById: (id: string) => Recipe | undefined
  onAddMeal: (params: { date: string }) => void
  onEditMeal: (mealPlan: MealPlan) => void
  onDeleteMeal?: (mealPlan: MealPlan) => void
}

type QuickFilterType = 'today' | 'nextweek' | 'custom'

export function CalendarView({
  mealPlans,
  getRecipeById,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
}: CalendarViewProps) {
  // Helper to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Memoize today's date string to ensure it's stable across renders
  const todayString = useMemo(() => {
    return getLocalDateString(new Date())
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
  const getDateRange = (): { start: Date; end: Date } => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)

    switch (quickFilter) {
      case 'today':
        // Start from today
        break
      case 'nextweek': {
        // Start from next Monday
        const daysUntilMonday = (8 - start.getDay()) % 7 || 7
        start.setDate(start.getDate() + daysUntilMonday)
        break
      }
      case 'custom':
        if (selectedDate) {
          start.setTime(selectedDate.getTime())
        }
        break
    }

    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    return { start, end }
  }

  const dateRange = getDateRange()

  // Generate all days in range (including empty days)
  const daysInRange = useMemo(() => {
    const days: Date[] = []
    const current = new Date(dateRange.start)
    current.setHours(0, 0, 0, 0)

    while (current <= dateRange.end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [dateRange.start, dateRange.end])

  // Group meals by date (including empty dates)
  const groupedMeals = useMemo(() => {
    const grouped: Array<{ date: string; dateObj: Date; meals: MealPlan[] }> =
      []

    daysInRange.forEach(day => {
      const dateString = getLocalDateString(day)
      const mealsForDay = mealPlans.filter(mp => mp.date === dateString)

      grouped.push({
        date: dateString,
        dateObj: day,
        meals: mealsForDay.sort(a => (a.mealType === 'lunch' ? -1 : 1)),
      })
    })

    return grouped
  }, [daysInRange, mealPlans])

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
    <Stack gap="md" role="region" aria-label="Meal Plans List" style={{ height: '100%', overflow: 'hidden' }}>
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
                  onAddMeal({ date: getLocalDateString(new Date()) })
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
                    {formatDate(group.date)}
                  </Title>

                  <DroppableDayCard
                    dateString={group.date}
                    meals={group.meals}
                    getRecipeById={getRecipeById}
                    onAddMeal={onAddMeal}
                    onEditMeal={onEditMeal}
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
