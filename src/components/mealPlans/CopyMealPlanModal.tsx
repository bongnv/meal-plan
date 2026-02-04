import {
  Modal,
  Stack,
  Group,
  Button,
  Radio,
  NumberInput,
  Select,
  Table,
  Text,
  Badge,
  Alert,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { useServices } from '../../contexts/ServicesContext'

import type {
  CopyFrequency,
  CopyEndCondition,
  CopyOptions,
  CopyResult,
  ConflictResolution,
} from '../../types/mealPlan'

interface CopyMealPlanModalProps {
  opened: boolean
  mealPlanId: string
  onClose: () => void
}

const WEEKDAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

export function CopyMealPlanModal({
  opened,
  mealPlanId,
  onClose,
}: CopyMealPlanModalProps) {
  const { mealPlanService } = useServices()
  const mealPlans =
    useLiveQuery(async () => mealPlanService.getMealPlans(), []) ?? []

  // Form state
  const [targetDate, setTargetDate] = useState<Date | null>(new Date())
  const [frequency, setFrequency] = useState<CopyFrequency>('one-time')
  const [weeklyInterval, setWeeklyInterval] = useState<number>(1)
  const [specificWeekday, setSpecificWeekday] = useState<string>('1') // Monday
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(7)
  const [endCondition, setEndCondition] =
    useState<CopyEndCondition>('after-occurrences')
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [occurrences, setOccurrences] = useState<number>(4)
  const [conflictResolution, setConflictResolution] =
    useState<ConflictResolution>('skip')

  // Preview state
  const [preview, setPreview] = useState<CopyResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Get the meal from the context
  const meal = mealPlans.find(m => m.id === mealPlanId)

  // If meal not found, don't render anything
  if (!meal) return null

  const handlePreview = async () => {
    if (!targetDate) return

    const options: CopyOptions = {
      frequency,
      targetDate,
      weeklyInterval: frequency === 'weekly' ? weeklyInterval : undefined,
      specificWeekday:
        frequency === 'specific-weekday'
          ? parseInt(specificWeekday)
          : undefined,
      customIntervalDays:
        frequency === 'custom-interval' ? customIntervalDays : undefined,
      endCondition: frequency !== 'one-time' ? endCondition : undefined,
      endDate:
        frequency !== 'one-time' && endCondition === 'until-date'
          ? endDate || undefined
          : undefined,
      occurrences:
        frequency !== 'one-time' && endCondition === 'after-occurrences'
          ? occurrences
          : undefined,
    }

    const result = await mealPlanService.generateCopyPreview(meal.id, options)
    setPreview(result)
    setShowPreview(true)
  }

  const handleCopy = () => {
    if (!targetDate || !preview) return

    const options: CopyOptions = {
      frequency,
      targetDate,
      weeklyInterval: frequency === 'weekly' ? weeklyInterval : undefined,
      specificWeekday:
        frequency === 'specific-weekday'
          ? parseInt(specificWeekday)
          : undefined,
      customIntervalDays:
        frequency === 'custom-interval' ? customIntervalDays : undefined,
      endCondition: frequency !== 'one-time' ? endCondition : undefined,
      endDate:
        frequency !== 'one-time' && endCondition === 'until-date'
          ? endDate || undefined
          : undefined,
      occurrences:
        frequency !== 'one-time' && endCondition === 'after-occurrences'
          ? occurrences
          : undefined,
    }

    void mealPlanService.copyMealPlan(meal.id, options, conflictResolution)
    onClose()
  }

  const handleClose = () => {
    setShowPreview(false)
    setPreview(null)
    onClose()
  }

  const isRecurring = frequency !== 'one-time'

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Copy Meal Plan"
      size="lg"
    >
      <Stack gap="md">
        {/* Target Date */}
        <DatePickerInput
          label="Target Date"
          value={targetDate}
          onChange={(value: string | null) =>
            setTargetDate(value ? new Date(value) : null)
          }
          required
        />

        {/* Frequency */}
        <Radio.Group
          label="Frequency"
          value={frequency}
          onChange={value => {
            setFrequency(value as CopyFrequency)
            setShowPreview(false)
            setPreview(null)
          }}
        >
          <Stack gap="xs" mt="xs">
            <Radio value="one-time" label="One-time" />
            <Radio value="weekly" label="Weekly" />
            <Radio value="specific-weekday" label="Specific weekday" />
            <Radio value="custom-interval" label="Custom interval" />
          </Stack>
        </Radio.Group>

        {/* Weekly interval */}
        {frequency === 'weekly' && (
          <NumberInput
            label="Repeat every X weeks"
            value={weeklyInterval}
            onChange={value =>
              setWeeklyInterval(typeof value === 'number' ? value : 1)
            }
            min={1}
            max={52}
          />
        )}

        {/* Specific weekday */}
        {frequency === 'specific-weekday' && (
          <Select
            label="Weekday"
            value={specificWeekday}
            onChange={value => setSpecificWeekday(value || '1')}
            data={WEEKDAYS}
          />
        )}

        {/* Custom interval */}
        {frequency === 'custom-interval' && (
          <NumberInput
            label="Repeat every X days"
            value={customIntervalDays}
            onChange={value =>
              setCustomIntervalDays(typeof value === 'number' ? value : 7)
            }
            min={1}
            max={365}
          />
        )}

        {/* End condition for recurring */}
        {isRecurring && (
          <>
            <Radio.Group
              label="End Condition"
              value={endCondition}
              onChange={value => {
                setEndCondition(value as CopyEndCondition)
                setShowPreview(false)
                setPreview(null)
              }}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="until-date" label="Until date" />
                <Radio value="after-occurrences" label="After occurrences" />
              </Stack>
            </Radio.Group>

            {endCondition === 'until-date' && (
              <DatePickerInput
                label="End Date"
                value={endDate}
                onChange={(value: string | null) =>
                  setEndDate(value ? new Date(value) : null)
                }
                minDate={targetDate || undefined}
                required
              />
            )}

            {endCondition === 'after-occurrences' && (
              <NumberInput
                label="Number of occurrences"
                value={occurrences}
                onChange={value =>
                  setOccurrences(typeof value === 'number' ? value : 4)
                }
                min={1}
                max={100}
              />
            )}
          </>
        )}

        {/* Preview button */}
        <Button onClick={handlePreview} variant="light">
          Preview
        </Button>

        {/* Preview results */}
        {showPreview && preview && (
          <>
            <Alert
              icon={
                preview.conflicts.length > 0 ? (
                  <IconAlertCircle size="1rem" />
                ) : (
                  <IconCheck size="1rem" />
                )
              }
              title={
                preview.conflicts.length > 0
                  ? 'Conflicts Detected'
                  : 'No Conflicts'
              }
              color={preview.conflicts.length > 0 ? 'yellow' : 'green'}
            >
              {preview.conflicts.length > 0 ? (
                <Text size="sm">
                  {preview.conflicts.length} date(s) already have a meal planned
                  for {meal.mealType}.
                </Text>
              ) : (
                <Text size="sm">
                  All {preview.preview.length} date(s) are available.
                </Text>
              )}
            </Alert>

            {/* Conflict resolution options */}
            {preview.conflicts.length > 0 && (
              <Radio.Group
                label="How to handle conflicts?"
                value={conflictResolution}
                onChange={value =>
                  setConflictResolution(value as ConflictResolution)
                }
              >
                <Stack gap="xs" mt="xs">
                  <Radio value="replace" label="Replace existing meals" />
                  <Radio value="skip" label="Skip conflicting dates" />
                  <Radio value="cancel" label="Cancel if any conflicts" />
                </Stack>
              </Radio.Group>
            )}

            {/* Preview table */}
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {preview.preview.map(item => (
                  <Table.Tr key={item.date}>
                    <Table.Td>{item.date}</Table.Td>
                    <Table.Td>
                      {item.hasConflict ? (
                        <Badge
                          color="yellow"
                          leftSection={<IconX size="0.8rem" />}
                        >
                          Conflict
                        </Badge>
                      ) : (
                        <Badge
                          color="green"
                          leftSection={<IconCheck size="0.8rem" />}
                        >
                          Available
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={!showPreview || !preview}>
            Copy
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
