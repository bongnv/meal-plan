import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { GroceryItem, GroceryList } from '../../types/groceryList'
import { INGREDIENT_CATEGORIES, UNITS } from '../../types/ingredient'

interface GroceryListViewProps {
  groceryList: GroceryList
  items: GroceryItem[]
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
  getIngredientName: (ingredientId: string) => string
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

export const GroceryListView = ({
  items,
  onCheckItem,
  onUpdateQuantity: _onUpdateQuantity,
  onUpdateNotes: _onUpdateNotes,
  onRemoveItem,
  onAddManualItem,
  getIngredientName,
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
              {items.map(item => {
                // For items with ingredientId, look up the name
                // For manual items (no ingredientId), use the stored name
                const itemName = item.ingredientId
                  ? getIngredientName(item.ingredientId)
                  : item.name || 'Manual Item' // Use stored name or fallback

                const mealText =
                  item.mealPlanIds.length === 1
                    ? '1 meal'
                    : `${item.mealPlanIds.length} meals`

                return (
                  <Card
                    key={item.id}
                    withBorder
                    p="xs"
                    radius="sm"
                    style={{
                      opacity: item.checked ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <Group
                      justify="space-between"
                      align="center"
                      wrap="nowrap"
                      gap="xs"
                    >
                      <Group
                        gap="xs"
                        align="center"
                        style={{ flex: 1, minWidth: 0 }}
                      >
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
                            textDecoration: item.checked
                              ? 'line-through'
                              : 'none',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {itemName} • {item.quantity} {item.unit}
                          {item.mealPlanIds.length > 0 && ` • ${mealText}`}
                          {item.notes && ` • ${item.notes}`}
                        </Text>
                      </Group>
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
                  </Card>
                )
              })}
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
