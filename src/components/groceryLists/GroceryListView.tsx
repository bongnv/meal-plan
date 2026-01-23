import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { GroceryItem, GroceryList } from '../../types/groceryList'
import { INGREDIENT_CATEGORIES, UNITS, Unit } from '../../types/ingredient'
import { MealPlan } from '../../types/mealPlan'

interface GroceryListViewProps {
  groceryList: GroceryList
  items: GroceryItem[]
  mealPlans: MealPlan[] // For meal plan references
  onCheckItem: (itemId: string) => void
  onUpdateQuantity?: (itemId: string, quantity: number, unit: string) => void
  onUpdateNotes?: (itemId: string, notes: string) => void
  onRemoveItem: (itemId: string) => void
  onAddManualItem: (item: {
    name: string
    quantity: number
    unit: string
    category: string
  }) => void
  getRecipeName: (recipeId: string) => string // For meal plan references
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  Vegetables: '🥬',
  Fruits: '🍎',
  Meat: '🥩',
  Poultry: '🍗',
  Seafood: '🐟',
  Dairy: '🥛',
  Grains: '🌾',
  Legumes: '🫘',
  'Nuts & Seeds': '🥜',
  'Herbs & Spices': '🌿',
  'Oils & Fats': '🫒',
  Condiments: '🍯',
  Baking: '🧁',
  Other: '📦',
}

// Item row component with inline editing
interface ItemRowProps {
  item: GroceryItem
  itemName: string
  mealPlans: MealPlan[]
  getRecipeName: (recipeId: string) => string
  onCheckItem: (itemId: string) => void
  onUpdateQuantity?: (itemId: string, quantity: number, unit: string) => void
  onUpdateNotes?: (itemId: string, notes: string) => void
  onRemoveItem: (itemId: string) => void
}

const ItemRow = ({
  item,
  itemName,
  mealPlans,
  getRecipeName,
  onCheckItem,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
}: ItemRowProps) => {
  const navigate = useNavigate()
  const [editPopoverOpened, setEditPopoverOpened] = useState(false)
  const [quantity, setQuantity] = useState(item.quantity)
  const [unit, setUnit] = useState<Unit>(item.unit)
  const [notes, setNotes] = useState(item.notes || '')

  // Get meal plan details
  const itemMealPlans = useMemo(() => {
    return mealPlans.filter(mp => item.mealPlanIds.includes(mp.id))
  }, [mealPlans, item.mealPlanIds])

  // Handle saving edits
  const handleSave = () => {
    if (onUpdateQuantity && (quantity !== item.quantity || unit !== item.unit)) {
      onUpdateQuantity(item.id, quantity, unit)
    }
    if (onUpdateNotes && notes !== (item.notes || '')) {
      onUpdateNotes(item.id, notes)
    }
    setEditPopoverOpened(false)
  }

  // Reset on cancel
  const handleCancel = () => {
    setQuantity(item.quantity)
    setUnit(item.unit)
    setNotes(item.notes || '')
    setEditPopoverOpened(false)
  }

  const handleMealClick = (mealPlan: MealPlan) => {
    // Navigate to calendar view with the meal plan's date
    navigate(`/?date=${mealPlan.date}`)
  }

  return (
    <Card
      withBorder
      p="xs"
      radius="sm"
      style={{
        opacity: item.checked ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" align="center" style={{ flex: 1, minWidth: 0 }}>
            <Checkbox
              checked={item.checked}
              onChange={() => onCheckItem(item.id)}
              size="sm"
            />
            <Text
              fw={500}
              size="sm"
              lineClamp={1}
              style={{
                textDecoration: item.checked ? 'line-through' : 'none',
                flex: 1,
                minWidth: 0,
              }}
            >
              {itemName} • {item.quantity} {item.unit}
              {item.notes && ` • ${item.notes}`}
            </Text>
          </Group>
          {itemMealPlans.length > 0 && (
            <Group gap={4} ml={28}>
              {itemMealPlans.map(mp => {
                const recipeName =
                  mp.type === 'recipe' ? getRecipeName(mp.recipeId) : mp.type
                return (
                  <Badge
                    key={mp.id}
                    size="xs"
                    variant="light"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleMealClick(mp)}
                  >
                    {recipeName} ({mp.date} {mp.mealType})
                  </Badge>
                )
              })}
            </Group>
          )}
        </Stack>
        <Group gap={4}>
          <Popover
            opened={editPopoverOpened}
            onChange={setEditPopoverOpened}
            position="left"
            withArrow
          >
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setEditPopoverOpened(true)}
                aria-label="Edit item"
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="sm" style={{ minWidth: 250 }}>
                <Group align="end" gap="xs">
                  <NumberInput
                    label="Quantity"
                    value={quantity}
                    onChange={val => setQuantity(Number(val) || 0)}
                    min={0.1}
                    step={0.5}
                    decimalScale={2}
                    style={{ flex: 1 }}
                    size="xs"
                  />
                  <Select
                    label="Unit"
                    data={UNITS.map(u => ({ value: u, label: u }))}
                    value={unit}
                    onChange={val => setUnit((val as Unit) || 'piece')}
                    style={{ flex: 1 }}
                    size="xs"
                  />
                </Group>
                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  size="xs"
                  rows={2}
                />
                <Group justify="flex-end" gap="xs">
                  <Button variant="subtle" size="xs" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="xs" onClick={handleSave}>
                    Save
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={() => onRemoveItem(item.id)}
            aria-label="Remove item"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  )
}

export const GroceryListView = ({
  items,
  mealPlans,
  onCheckItem,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onAddManualItem,
  getRecipeName,
}: GroceryListViewProps) => {
  // Manual item form state
  const [manualItemName, setManualItemName] = useState('')
  const [manualItemQuantity, setManualItemQuantity] = useState<number>(1)
  const [manualItemUnit, setManualItemUnit] = useState<string>('piece')
  const [manualItemCategory, setManualItemCategory] = useState<string>('Other')

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {}

    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })

    return groups
  }, [items])

  // Get sorted categories (only non-empty ones)
  const sortedCategories = useMemo(() => {
    return INGREDIENT_CATEGORIES.filter(
      category => itemsByCategory[category]?.length > 0
    )
  }, [itemsByCategory])

  // Calculate checked count
  const checkedCount = useMemo(() => {
    return items.filter(item => item.checked).length
  }, [items])

  const handleAddManualItem = () => {
    if (!manualItemName.trim()) return

    onAddManualItem({
      name: manualItemName.trim(),
      quantity: manualItemQuantity,
      unit: manualItemUnit,
      category: manualItemCategory,
    })

    // Reset form
    setManualItemName('')
    setManualItemQuantity(1)
    setManualItemUnit('piece')
    setManualItemCategory('Other')
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            Grocery Items
          </Text>
          <Badge size="lg" variant="light">
            0 / 0 checked
          </Badge>
        </Group>

        <Card withBorder p="xl" radius="md">
          <Stack align="center" gap="md">
            <Text size="lg" c="dimmed">
              No items in this grocery list
            </Text>
            <Text size="sm" c="dimmed">
              Add manual items below or regenerate the list
            </Text>
          </Stack>
        </Card>

        <Divider />

        {/* Add Manual Item Section */}
        <Card withBorder p="md" radius="md">
          <Stack gap="md">
            <Title order={4}>Add Manual Item</Title>
            <Group align="end" wrap="nowrap">
              <TextInput
                label="Item name"
                placeholder="Item name"
                value={manualItemName}
                onChange={e => setManualItemName(e.target.value)}
                style={{ flex: 2 }}
              />
              <NumberInput
                label="Quantity"
                placeholder="Quantity"
                value={manualItemQuantity}
                onChange={val => setManualItemQuantity(Number(val) || 1)}
                min={0.1}
                step={0.5}
                decimalScale={2}
                style={{ flex: 1 }}
              />
              <Select
                label="Unit"
                data={UNITS.map(u => ({ value: u, label: u }))}
                value={manualItemUnit}
                onChange={val => setManualItemUnit(val || 'piece')}
                style={{ flex: 1 }}
              />
              <Select
                label="Category"
                data={INGREDIENT_CATEGORIES.map(c => ({ value: c, label: c }))}
                value={manualItemCategory}
                onChange={val => setManualItemCategory(val || 'Other')}
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleAddManualItem}
              >
                Add item
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      {/* Header with progress */}
      <Group justify="space-between">
        <Text fw={500} size="lg">
          Grocery Items
        </Text>
        <Badge size="lg" variant="light">
          {checkedCount} / {items.length} checked
        </Badge>
      </Group>

      {/* Items grouped by category */}
      {sortedCategories.map(category => {
        const items = itemsByCategory[category] || []

        return (
          <div key={category}>
            <Group gap="xs" mb="sm">
              <Text size="sm">{CATEGORY_ICONS[category]}</Text>
              <Title order={4}>{category}</Title>
              <Badge variant="light" size="sm">
                {items.length}
              </Badge>
            </Group>

            <Stack gap={4}>
              {items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  itemName={item.name}
                  mealPlans={mealPlans}
                  getRecipeName={getRecipeName}
                  onCheckItem={onCheckItem}
                  onUpdateQuantity={onUpdateQuantity}
                  onUpdateNotes={onUpdateNotes}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </Stack>
          </div>
        )
      })}

      <Divider />

      {/* Add Manual Item Section */}
      <Card withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={4}>Add Manual Item</Title>
          <Group align="end" wrap="nowrap">
            <TextInput
              label="Item name"
              placeholder="Item name"
              value={manualItemName}
              onChange={e => setManualItemName(e.target.value)}
              style={{ flex: 2 }}
            />
            <NumberInput
              label="Quantity"
              placeholder="Quantity"
              value={manualItemQuantity}
              onChange={val => setManualItemQuantity(Number(val) || 1)}
              min={0.1}
              step={0.5}
              decimalScale={2}
              style={{ flex: 1 }}
            />
            <Select
              label="Unit"
              data={UNITS.map(u => ({ value: u, label: u }))}
              value={manualItemUnit}
              onChange={val => setManualItemUnit(val || 'piece')}
              style={{ flex: 1 }}
            />
            <Select
              label="Category"
              data={INGREDIENT_CATEGORIES.map(c => ({ value: c, label: c }))}
              value={manualItemCategory}
              onChange={val => setManualItemCategory(val || 'Other')}
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddManualItem}
            >
              Add item
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  )
}
