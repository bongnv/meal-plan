import type { MealPlan, MealType } from '../../types/mealPlan'

/**
 * Get the time string for a meal type (for sorting and comparison)
 * @param mealType - The type of meal
 * @returns Time string in HH:MM:SS format
 */
export function getMealTime(mealType: MealType): string {
  const times: Record<MealType, string> = {
    breakfast: '08:00:00',
    lunch: '12:00:00',
    snack: '15:00:00',
    dinner: '18:00:00',
  }
  return times[mealType]
}

/**
 * Format a meal date relative to today
 * @param date - ISO date string (YYYY-MM-DD)
 * @param mealType - The type of meal
 * @returns Formatted string like "TODAY - Dinner", "TOMORROW - Lunch", or "Thu, Jan 30 - Dinner"
 */
export function formatMealDate(date: string, mealType: MealType): string {
  // Parse date as local date to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number)
  const mealDate = new Date(year, month - 1, day)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const mealDateNormalized = new Date(year, month - 1, day)
  mealDateNormalized.setHours(0, 0, 0, 0)

  // Capitalize first letter of meal type
  const capitalizedMealType =
    mealType.charAt(0).toUpperCase() + mealType.slice(1)

  if (mealDateNormalized.getTime() === today.getTime()) {
    return `TODAY - ${capitalizedMealType}`
  } else if (mealDateNormalized.getTime() === tomorrow.getTime()) {
    return `TOMORROW - ${capitalizedMealType}`
  } else {
    // Format as "Thu, Jan 30"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
    const formatted = mealDate.toLocaleDateString('en-US', options)
    return `${formatted} - ${capitalizedMealType}`
  }
}

/**
 * Get the next upcoming meal (most imminent)
 * @param mealPlans - Array of all meal plans
 * @returns The next meal plan after current time, or null if none exist
 */
export function getNextMeal(mealPlans: MealPlan[]): MealPlan | null {
  const now = new Date()

  // Filter and sort upcoming meals
  const upcomingMeals = mealPlans
    .filter(mp => {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = mp.date.split('-').map(Number)
      const [hours, minutes, seconds] = getMealTime(mp.mealType)
        .split(':')
        .map(Number)
      const mealDateTime = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        seconds
      )
      return mealDateTime >= now
    })
    .sort((a, b) => {
      const [yearA, monthA, dayA] = a.date.split('-').map(Number)
      const [hoursA, minutesA, secondsA] = getMealTime(a.mealType)
        .split(':')
        .map(Number)
      const dateA = new Date(
        yearA,
        monthA - 1,
        dayA,
        hoursA,
        minutesA,
        secondsA
      )

      const [yearB, monthB, dayB] = b.date.split('-').map(Number)
      const [hoursB, minutesB, secondsB] = getMealTime(b.mealType)
        .split(':')
        .map(Number)
      const dateB = new Date(
        yearB,
        monthB - 1,
        dayB,
        hoursB,
        minutesB,
        secondsB
      )

      return dateA.getTime() - dateB.getTime()
    })

  return upcomingMeals.length > 0 ? upcomingMeals[0] : null
}

/**
 * Get the next N upcoming meals starting from today
 * @param mealPlans - Array of all meal plans
 * @param count - Number of meals to return
 * @returns Array of upcoming meal plans (from today onwards), sorted by date/time
 */
export function getUpcomingMeals(
  mealPlans: MealPlan[],
  count: number
): MealPlan[] {
  // Get start of today (midnight)
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Filter and sort upcoming meals (from start of today onwards)
  const upcomingMeals = mealPlans
    .filter(mp => {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = mp.date.split('-').map(Number)
      const [hours, minutes, seconds] = getMealTime(mp.mealType)
        .split(':')
        .map(Number)
      const mealDateTime = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        seconds
      )
      return mealDateTime >= startOfToday
    })
    .sort((a, b) => {
      // Parse as local date to avoid timezone issues
      const [yearA, monthA, dayA] = a.date.split('-').map(Number)
      const [hoursA, minutesA, secondsA] = getMealTime(a.mealType)
        .split(':')
        .map(Number)
      const dateA = new Date(
        yearA,
        monthA - 1,
        dayA,
        hoursA,
        minutesA,
        secondsA
      )

      const [yearB, monthB, dayB] = b.date.split('-').map(Number)
      const [hoursB, minutesB, secondsB] = getMealTime(b.mealType)
        .split(':')
        .map(Number)
      const dateB = new Date(
        yearB,
        monthB - 1,
        dayB,
        hoursB,
        minutesB,
        secondsB
      )

      return dateA.getTime() - dateB.getTime()
    })

  return upcomingMeals.slice(0, count)
}
