import { AppShell, Group, Title, Anchor, Burger, NavLink } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconChefHat,
  IconCarrot,
  IconSettings,
  IconCalendar,
  IconCloud,
  IconShoppingCart,
} from '@tabler/icons-react'
import { Route, Routes, useLocation, Link } from 'react-router-dom'

import { SyncStatusIndicator } from './components/header/SyncStatusIndicator'
import { CloudSyncSettings } from './components/settings/CloudSyncSettings'
import { ReconnectModal } from './components/sync/ReconnectModal'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { useCloudStorage } from './contexts/CloudStorageContext'
import { useSyncContext } from './contexts/SyncContext'
import { GroceryListDetailPage } from './pages/groceryLists/GroceryListDetailPage'
import { GroceryListsPage } from './pages/groceryLists/GroceryListsPage'
import { HomePage } from './pages/HomePage'
import { MealPlanDetailPage } from './pages/mealPlans/MealPlanDetailPage'
import { MealPlansPage } from './pages/mealPlans/MealPlansPage'
import { CreateRecipePage } from './pages/recipes/CreateRecipePage'
import { EditRecipePage } from './pages/recipes/EditRecipePage'
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage'
import { RecipesPage } from './pages/recipes/RecipesPage'
import { IngredientsPage } from './pages/settings/IngredientsPage'

function App() {
  const [opened, { toggle, close }] = useDisclosure()
  const location = useLocation()
  const cloudStorage = useCloudStorage()
  const { needsReconnect, selectedFile, clearReconnectFlag } = useSyncContext()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const isSettingsActive = () => {
    return location.pathname.startsWith('/settings')
  }

  const navItems = [
    { path: '/recipes', label: 'Recipes', icon: IconChefHat },
    { path: '/meal-plans', label: 'Meal Plans', icon: IconCalendar },
    { path: '/grocery-lists', label: 'Grocery Lists', icon: IconShoppingCart },
  ]

  const settingsItems = [
    { path: '/settings/ingredients', label: 'Ingredients', icon: IconCarrot },
    { path: '/settings/cloud-sync', label: 'Cloud Sync', icon: IconCloud },
  ]

  // Handler for reconnect button
  const handleReconnect = async () => {
    try {
      // Re-authenticate with OneDrive
      if (cloudStorage.currentProvider) {
        await cloudStorage.connect(cloudStorage.currentProvider)
      }
      // Clear reconnect flag - auto-sync will resume automatically
      clearReconnectFlag()
    } catch (error) {
      console.error('Reconnect failed:', error)
      // Keep reconnect modal open if reconnection fails
    }
  }

  // Handler for work offline button
  const handleWorkOffline = () => {
    // Just clear the reconnect flag - keep data and selectedFile intact
    clearReconnectFlag()
  }

  return (
    <>
      <WelcomeScreen />
      <ReconnectModal
        opened={needsReconnect}
        fileName={selectedFile?.name || 'Unknown file'}
        onReconnect={handleReconnect}
        onWorkOffline={handleWorkOffline}
      />
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 250,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="xs">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Anchor
                component={Link}
                to="/"
                underline="never"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <IconChefHat size={28} color="var(--mantine-color-blue-6)" />
                <Title order={2} c="blue.7">
                  Meal Plan
                </Title>
              </Anchor>
            </Group>
            <SyncStatusIndicator />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={<item.icon size={20} stroke={1.5} />}
              active={isActive(item.path)}
              onClick={close}
            />
          ))}

          <NavLink
            label="Settings"
            leftSection={<IconSettings size={20} stroke={1.5} />}
            active={isSettingsActive()}
            defaultOpened={isSettingsActive()}
            onClick={close}
          >
            {settingsItems.map(item => (
              <NavLink
                key={item.path}
                component={Link}
                to={item.path}
                label={item.label}
                leftSection={<item.icon size={20} stroke={1.5} />}
                active={isActive(item.path)}
                onClick={close}
              />
            ))}
          </NavLink>
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<CreateRecipePage />} />
            <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/meal-plans" element={<MealPlansPage />} />
            <Route path="/meal-plans/:id" element={<MealPlanDetailPage />} />
            <Route path="/grocery-lists" element={<GroceryListsPage />} />
            <Route
              path="/grocery-lists/:id"
              element={<GroceryListDetailPage />}
            />
            <Route path="/settings/ingredients" element={<IngredientsPage />} />
            <Route
              path="/settings/cloud-sync"
              element={<CloudSyncSettings />}
            />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  )
}

export default App
