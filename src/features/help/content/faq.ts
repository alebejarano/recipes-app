export type FaqItem = {
  id: string
  question: string
  answers: string[]
}

export type FaqSection = {
  id: string
  title: string
  items: FaqItem[]
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        id: 'add-first-recipe',
        question: 'How do I add my first recipe?',
        answers: [
          "Tap the '+' button in the tab bar, then choose 'Recipe'.",
          'You can type it manually, paste from a URL, or import a PDF.',
        ],
      },
      {
        id: 'import-websites',
        question: 'Can I import recipes from websites?',
        answers: [
          'Yes. Paste the recipe URL when creating a new recipe and we’ll try to extract the details automatically.',
        ],
      },
      {
        id: 'collections',
        question: 'How do collections work?',
        answers: [
          'Collections (folders) help you organize recipes by category, cuisine, or occasion.',
        ],
      },
    ],
  },
  {
    id: 'account-billing',
    title: 'Account & Billing',
    items: [
      {
        id: 'upgrade',
        question: 'How do I upgrade to Premium?',
        answers: [
          'Go to your Profile tab and select Premium.',
          'Choose monthly or yearly and confirm through the app store.',
        ],
      },
      {
        id: 'cancel',
        question: 'Can I cancel my subscription?',
        answers: [
          'Yes. You can cancel anytime from your Apple or Google subscription settings.',
          'Your Premium features remain active until the end of your billing period.',
        ],
      },
      {
        id: 'change-email',
        question: 'How do I change my email or name?',
        answers: [
          'Go to your Profile settings to update your account information.',
        ],
      },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    items: [
      {
        id: 'shopping-list',
        question: 'What does the shopping list do?',
        answers: [
          'The shopping list helps you gather ingredients from your recipes in one place so you can check items off while shopping.',
        ],
      },
      {
        id: 'meal-planning',
        question: 'How does meal planning work?',
        answers: [
          'You can organize recipes by collections and pick what to cook during the week, then use your shopping list to prepare faster.',
        ],
      },
      {
        id: 'share-recipes',
        question: 'Can I share recipes with friends?',
        answers: [
          'Recipe sharing is limited for now, but we are improving options to make sharing easier.',
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      {
        id: 'import-issue',
        question: "My recipe didn't import correctly",
        answers: [
          'Try importing again with a clearer source or edit the recipe manually after import to fix missing fields.',
        ],
      },
      {
        id: 'app-slow',
        question: 'The app feels slow',
        answers: [
          'Close and reopen the app, then make sure your device has enough free storage and a stable internet connection.',
        ],
      },
    ],
  },
]
