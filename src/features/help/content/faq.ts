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
        id: 'account-use',
        question: 'Do I need an account to use the app?',
        answers: [
          "No. You can use the app without an account and save recipes locally on your device.",
          "Create an account if you’d like to upgrade and sync your library across devices later.",
        ],
      },
      {
        id: 'offline',
        question: 'Does the app work offline?',
        answers: [
          "Yes. You can create, edit, and view recipes offline.",
          "If you have Premium, changes sync automatically when you reconnect.",
        ],
      },
      {
        id: 'add-first-recipe',
        question: 'How do I add my first recipe?',
        answers: [
          "Tap the '+' button in the tab bar, then choose 'Recipe'.",
          'You can type it manually or import a PDF or Image.',
        ],
      },
      // {
      //   id: 'import-websites',
      //   question: 'Can I import recipes from websites?',
      //   answers: [
      //     'Yes. Paste the recipe URL when creating a new recipe and we’ll try to extract the details automatically.',
              // 'Not yet — for now you can save the link and add the recipe manually. Website import is coming soon.'
      //   ],
      // },
      {
        id: 'collections',
        question: 'How do collections work?',
        answers: [
          'Collections are your main library. They include your recipes, imports, notes, and shopping list.',
          'You can group recipes into folders to organize them by category, cuisine, or occasion.',
        ],
      },
    ],
  },
  {
    id: 'your-data-account',
    title: 'Your Data & Account',
    items: [
      {
        id: 'no-upgrade',
        question: "What happens if I don't upgrade?",
        answers: [
          'Your recipes stay safely stored on this device.',
          "If you uninstall the app or switch to a new device without Premium, your recipes won't automatically transfer.",
          'You can upgrade anytime to import and sync them.',
        ],
      },
      {
        id: 'upgrade-premium-data',
        question: 'What happens when I upgrade to Premium?',
        answers: [
          'When you upgrade, we automatically import all recipes, notes, and folders from this device into your account.',
          'From then on, everything stays synced across your devices.',
          'Nothing is overwritten. Nothing is deleted.',
        ],
      },
      {
        id: 'cancel-premium-data',
        question: 'What happens if I cancel Premium?',
        answers: [
          'If you cancel, your synced data remains safely stored in your account.',
          'At the end of your subscription, syncing stops.',
          'New changes stay local to your device.',
          'You can renew anytime to resume syncing.',
        ],
      },
      {
        id: 'change-phones',
        question: 'What happens if I change phones?',
        answers: [
          'With Premium, simply install the app and sign in. Your recipes will sync automatically.',
          'Without Premium, your recipes remain on your original device.',
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
    id: 'cloud-sync',
    title: 'Cloud Sync',
    items: [
      {
        id: 'cloud-sync-includes',
        question: 'What does Premium include?',
        answers: [
          'Premium securely backs up and syncs your:',
          'Recipes',
          'Notes',
          'Folders',
          'Images (PNG, JPG)',
          'Imported PDFs',
          "When you upgrade, we also import everything you've already created on this device.",
          'The app remains fully usable offline.',
          "Changes sync automatically when you're connected.",
        ],
      },
      {
        id: 'work-offline',
        question: 'Does the app work offline?',
        answers: [
          'Yes. You can view, edit, and create recipes without internet.',
          'Sync happens automatically when you reconnect.',
        ],
      },
      {
        id: 'storage-limit',
        question: 'Is there a storage limit?',
        answers: [
          'Premium includes:',
          'Up to 10MB per file (PDF or image)',
          "5GB total storage for your library. That's more than enough for most home cooks.",
          "If you ever approach the limit, we'll let you know.",
        ],
      },
      {
        id: 'recipes-private',
        question: 'Are my recipes private?',
        answers: [
          'Yes. Your recipes and files are private to your account.',
          'We do not access or share your personal content.',
        ],
      },
    ],
  },
  {
    id: 'account-billing',
    title: 'Billing & Subscription',
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
        id: 'switch-plan',
        question: 'Can I switch between monthly and yearly plans?',
        answers: [
          'Yes. You can switch at any time through your app store subscription settings.',
        ],
      },
      {
        id: 'subscription-multiple-devices',
        question: 'Can I use my subscription on multiple devices?',
        answers: [
          "Yes. As long as you're signed into the same account, your subscription and synced library are available across your devices.",
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
      // {
      //   id: 'meal-planning',
      //   question: 'How does meal planning work?',
      //   answers: [
      //     'You can organize recipes by collections and pick what to cook during the week, then use your shopping list to prepare faster.',
      //   ],
      // },
      {
        id: 'share-recipes',
        question: 'Can I share recipes?',
        answers: [
          'Yes — open any recipe and tap the share icon. You can send the recipe as a file (.txt) or share it directly as plain text.',
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
