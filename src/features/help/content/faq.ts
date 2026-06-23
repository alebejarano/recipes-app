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
          "Create an account if you'd like to upgrade and sync your library across devices.",
        ],
      },
      {
        id: 'offline',
        question: 'Does the app work offline?',
        answers: [
          "Yes. You can create, edit, and view recipes without an internet connection.",
          'Imports from Dropbox, Drive, iCloud, and similar providers must be available offline or downloaded to your phone before you can import them.',
          "If you have Premium, changes sync automatically when you reconnect.",
        ],
      },
      {
        id: 'add-first-recipe',
        question: 'How do I add my first recipe?',
        answers: [
          "Tap the '+' button in the tab bar, then choose 'Recipe'.",
          "You can type it manually or import a PDF or image.",
        ],
      },
      {
        id: 'collections',
        question: 'How do collections work?',
        answers: [
          "Collections are your main library. They include your recipes, imports, notes, and shopping list.",
          "You can group recipes into folders to organize them by category, cuisine, or occasion.",
        ],
      },
    ],
  },

  {
    id: 'account-data',
    title: 'Account & Data',
    items: [
      {
        id: 'free-plan-limits',
        question: 'What are the limits of the Free plan?',
        answers: [
          'The Free plan includes:',
          '• Up to 100 recipes',
          '• Up to 10MB per import file (PDF or image)',
          '• Up to 50MB total storage for imports and images',
          '• Unlimited notes',
          '• Full offline access on this device',
          'Imported cloud files must still be available offline or downloaded locally before import.',
          'You can upgrade anytime to remove recipe and storage limits and enable cloud sync.',
        ],
      },
      {
        id: 'free-plan-reach',
        question: 'What happens if I reach the Free plan limit?',
        answers: [
          "If you reach the recipe or storage limit, you won’t be able to add new recipes or imports until you free up space or upgrade to Premium.",
          "Your existing content remains accessible.",
        ],
      },
      {
        id: 'free-plan-device-space',
        question: 'Why can I save more recipes, notes, or imports if I have not hit the Free plan limits?',
        answers: [
          'Free plan limits are app limits, but your device still needs enough available storage to save new data.',
          'If your phone is low on space, imports or images may fail even when your plan limits have not been reached.',
          'Try freeing up device storage and then import again.',
        ],
      },
      {
        id: 'no-upgrade',
        question: "What happens if I don't upgrade?",
        answers: [
          'Your recipes stay safely stored on this device.',
          "If you uninstall the app or switch devices without Premium, your recipes won't automatically transfer.",
          'You can upgrade anytime to sync them.',
        ],
      },
      {
        id: 'upgrade-premium-data',
        question: 'What happens when I upgrade to Premium?',
        answers: [
          'We automatically import all recipes, notes, and folders from this device into your account.',
          'From then on, everything stays synced across your devices.',
          'Nothing is overwritten. Nothing is deleted.',
        ],
      },
      {
        id: 'cancel-premium-data',
        question: 'What happens if I cancel Premium?',
        answers: [
          'Your synced data remains safely stored in your account.',
          'Syncing stops at the end of your subscription.',
          'New changes stay local to your device unless you renew.',
        ],
      },
      {
        id: 'change-phones',
        question: 'What happens if I change phones?',
        answers: [
          'With Premium, install the app and sign in. Your recipes will sync automatically.',
          'Without Premium, your recipes remain on your original device.',
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
    id: 'premium',
    title: 'Premium',
    items: [
      {
        id: 'premium-includes',
        question: 'What does Premium include?',
        answers: [
          'Premium removes Free plan limits and enables secure cloud sync.',
          'You get:',
          '• Unlimited recipes',
          '• Sync across devices',
          '• Images (PNG, JPG)',
          '• Imported PDFs',
          '• Notes and folders',
          "When you upgrade, we automatically import everything you've already created on this device.",
          'The app remains fully usable offline after a file has been saved on this device. Cloud providers like Dropbox still need to make the selected file available locally before import.',
        ],
      },
      {
        id: 'storage-limit',
        question: 'Is there a storage limit with Premium?',
        answers: [
          'Premium includes:',
          '• Up to 10MB per file (PDF or image)',
          '• 5GB total storage for your library',
          '• Unlimited recipes and notes',
          "If you ever approach the limit, we'll let you know.",
        ],
      },
      {
        id: 'subscription-multiple-devices',
        question: 'Can I use Premium on multiple devices?',
        answers: [
          "Yes. As long as you're signed into the same account, your synced library is available across your devices.",
        ],
      },
    ],
  },

  {
    id: 'billing',
    title: 'Billing',
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
          'Premium remains active until the end of your billing period.',
        ],
      },
      {
        id: 'switch-plan',
        question: 'Can I switch between monthly and yearly plans?',
        answers: [
          'Yes. You can switch at any time through your app store subscription settings.',
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
          'The shopping list gathers ingredients from your recipes in one place so you can check items off while shopping.',
        ],
      },
      {
        id: 'share-recipes',
        question: 'Can I share recipes?',
        answers: [
          'Yes. Open any recipe and tap the share icon.',
          'You can export it as a .txt file or share it directly as plain text.',
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
          'Try importing again with a clearer source.',
          'You can always edit the recipe manually to fix missing fields.',
        ],
      },
      {
        id: 'app-slow',
        question: 'The app feels slow',
        answers: [
          'Close and reopen the app.',
          'Make sure your device has enough free storage and a stable internet connection.',
        ],
      },
    ],
  },
]
