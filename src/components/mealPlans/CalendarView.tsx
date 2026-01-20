import { useState } from 'react'

import { ActionIcon, Box, Button, Group, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

import { DroppableMealSlot } from './DroppableMealSlot'

import type { MealPlan, MealType } from '../../types/mealPlan'
import type { Recipe } from '../../types/recipe'

type ViewMode = 'week' | 'month'

interface CalendarViewProps {
  mealPlans: MealPlan[]
  getRecipeById: (id: string) => Recipe | undefined
  onAddMeal: (params: { date: string }) => void
  onEditMeal: (mealPlan: MealPlan) => void
}

interface DayData {
  date: Date
  dateString: string
  isToday: boolean
  isCurrentMonth: boolean
}

export function CalendarView({ mealPlans, getRecipeById, onAddMeal, onEditMeal }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // Get days to display based on view mode
  const getDaysToDisplay = (): DayData[] => {
    const days: DayData[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (viewMode === 'week') {
      // Get current week (Sunday to Saturday)
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateString = date.toISOString().split('T')[0]
        
        days.push({
          date,
          dateString,
          isToday: date.getTime() === today.getTime(),
          isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        })
      }
    } else {
      // Month view - show full calendar grid
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      // Get first day of month and adjust to start on Sunday
      const firstDay = new Date(year, month, 1)
      const startDay = new Date(firstDay)
      startDay.setDate(1 - firstDay.getDay())
      
      // Get last day of month and adjust to end on Saturday
      const lastDay = new Date(year, month + 1, 0)
      const endDay = new Date(lastDay)
      endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
      
      // Generate all days in the grid
      const current = new Date(startDay)
      while (current <= endDay) {
        const dateString = current.toISOString().split('T')[0]
        days.push({
          date: new Date(current),
          dateString,
          isToday: current.getTime() === today.getTime(),
          isCurrentMonth: current.getMonth() === month,
        })
        current.setDate(current.getDate() + 1)
      }
    }

    return days
  }

  const days = getDaysToDisplay()

  // Get meals for a specific date and meal type
  const getMealsForSlot = (dateString: string, mealType: MealType): MealPlan | undefined => {
    return mealPlans.find(mp => mp.date === dateString && mp.mealType === mealType)
  }

  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setMonth(currentDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
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

  return (
    <Stack gap="md" role="region" aria-label="Calendar">
      {/* Header with navigation */}
      <Group justify="space-between">
        <Title order={2}>{getHeaderText()}</Title>
        
        <Group gap="xs">
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            data={[
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' },
            ]}
            data-active={viewMode}
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
                        <DroppableMealSlot
                          dateString={dateString}
                          mealType="lunch"
                          meal={lunchMeal}
                          getRecipeById={getRecipeById}
                          onAddMeal={onAddMeal}
                          onEditMeal={onEditMeal}
                        />
                      )}
                      {dinnerMeal && (
                        <DroppableMealSlot
                          dateString={dateString}
                          mealType="dinner"
                          meal={dinnerMeal}
                          getRecipeById={getRecipeById}
                          onAddMeal={onAddMeal}
                          onEditMeal={onEditMeal}
                        />
                      )}
                    </>
                  )}
                </Stack>
              </Stack>
            </Paper>
          )
        })}
      </Box>
    </Stack>
  )
}
