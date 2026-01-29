import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Paper,
  Divider,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'

import { db } from '../../db/database'
import { groceryListService } from '../../services/groceryListService'
import { mealPlanService } from '../../services/mealPlanService'

interface GroceryListGeneratorProps {
  opened: boolean
  onClose: () => void
  onGenerate: (params: {
    startDate: Date
    endDate: Date
    name?: string
  }) => void
}

export const GroceryListGenerator = ({
  opened,
  onClose,
  onGenerate,
}: GroceryListGeneratorProps) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ])
  const [name, setName] = useState('')

  // Get data from contexts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mealPlans = useLiveQuery(async () => db.mealPlans.toArray(), []) ?? []

  const quickSelectRanges = [
    { label: 'Next 7 days', days: 7 },
    { label: 'Next 14 days', days: 14 },
    { label: 'Next 30 days', days: 30 },
  ]

  const handleQuickSelect = (days: number) => {
    setDateRange(groceryListService.getQuickDateRange(days))
  }

  const handleGenerate = () => {
    const [startDate, endDate] = dateRange
    if (!startDate || !endDate) return

    // Ensure dates are Date objects
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)

    // Generate default name if not provided
    const listName =
      name.trim() || groceryListService.generateDefaultListName(start)

    try {
      // Call parent callback with date range and name
      onGenerate({
        startDate: start,
        endDate: end,
        name: listName,
      })

      onClose()
    } catch {
      notifications.show({
        title: 'Generation failed',
        message: 'Failed to generate grocery list. Please try again.',
        color: 'red',
      })
    }
  }

  // Generate button is disabled if date range is not fully selected
  const [startDate, endDate] = dateRange
  const isGenerateDisabled = !startDate || !endDate

  // Calculate number of days in range
  const daysInRange =
    startDate && endDate && startDate instanceof Date && endDate instanceof Date
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0

  // Calculate meal count from actual meal plans in date range
  const mealCount = useMemo(() => {
    if (!startDate || !endDate) return 0
    // Ensure dates are Date objects (DatePickerInput may return other types)
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    return mealPlanService.countRecipeMealsInRange(mealPlans, start, end)
  }, [startDate, endDate, mealPlans])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Generate Grocery List"
      size="lg"
    >
      <Stack gap="lg">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Quick Select
          </Text>
          <Group gap="xs">
            {quickSelectRanges.map(range => (
              <Button
                key={range.days}
                variant="light"
                size="sm"
                onClick={() => handleQuickSelect(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </Group>
        </div>

        <Divider />

        <div>
          <DatePickerInput
            type="range"
            label="Custom Date Range"
            placeholder="Select date range"
            value={dateRange}
            onChange={value =>
              setDateRange(value as [Date | null, Date | null])
            }
            clearable
            numberOfColumns={2}
            size="sm"
            getDayProps={date => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const checkDate = new Date(date)
              checkDate.setHours(0, 0, 0, 0)
              return {
                style:
                  checkDate.getTime() === today.getTime()
                    ? {
                        backgroundColor: 'var(--mantine-color-blue-light)',
                        fontWeight: 'bold',
                      }
                    : undefined,
              }
            }}
          />
          {daysInRange > 0 && (
            <Text size="sm" c="dimmed" mt="xs">
              {daysInRange} {daysInRange === 1 ? 'day' : 'days'} selected
            </Text>
          )}
        </div>

        {daysInRange > 0 && (
          <>
            <Divider />
            <Paper p="md" withBorder bg="gray.0">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Date Range Summary
                </Text>
                <Group gap="xl">
                  <div>
                    <Text size="xs" c="dimmed">
                      From
                    </Text>
                    <Text size="sm">
                      {startDate instanceof Date
                        ? startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      To
                    </Text>
                    <Text size="sm">
                      {endDate instanceof Date
                        ? endDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Days
                    </Text>
                    <Text size="sm" fw={500}>
                      {daysInRange}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Meals
                    </Text>
                    <Text size="sm" fw={500}>
                      {mealCount}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Paper>
          </>
        )}

        <Divider />

        <TextInput
          label="List Name (optional)"
          placeholder="e.g., Weekly Groceries"
          value={name}
          onChange={e => setName(e.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerateDisabled}>
            Generate List
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
