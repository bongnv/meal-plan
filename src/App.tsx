import { AppShell, Group, Title, Anchor, Burger, NavLink } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChefHat, IconCarrot } from '@tabler/icons-react'
import { Route, Routes, useLocation, Link } from 'react-router-dom'

import { CreateRecipePage } from './pages/recipes/CreateRecipePage'
import { EditRecipePage } from './pages/recipes/EditRecipePage'
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage'
import { RecipesPage } from './pages/recipes/RecipesPage'
import { IngredientsPage } from './pages/settings/IngredientsPage'

function App() {
  const [opened, { toggle, close }] = useDisclosure()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/recipes', label: 'Recipes', icon: IconChefHat },
    { path: '/settings/ingredients', label: 'Ingredients', icon: IconCarrot },
  ]

  return (
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
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
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
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>Meal Plan</h1>
                <p>Home page - coming soon</p>
              </div>
            }
          />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/new" element={<CreateRecipePage />} />
          <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/settings/ingredients" element={<IngredientsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
