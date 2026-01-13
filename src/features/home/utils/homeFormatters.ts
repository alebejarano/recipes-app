export type MealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export function getMealTime(now: Date): MealTime {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'breakfast';
  if (h >= 11 && h < 15) return 'lunch';
  if (h >= 15 && h < 19) return 'snack';
  return 'dinner';
}

export function getPickLabel(meal: MealTime) {
  switch (meal) {
    case 'breakfast':
      return 'Breakfast pick';
    case 'lunch':
      return 'Lunch pick';
    case 'snack':
      return 'Snack pick';
    case 'dinner':
      return 'Dinner pick';
  }
}

export function formatRelativeDay(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((+now - +d) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export function sortMostRecent<T extends { updatedAt?: string; createdAt?: string }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const at = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const bt = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return bt - at;
  });
}
