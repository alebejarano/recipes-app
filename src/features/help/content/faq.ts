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

const FAQ_SECTIONS_BY_LOCALE: Record<'en' | 'es', FaqSection[]> = {
  en: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        {
          id: 'account-use',
          question: 'Do I need an account to use the app?',
          answers: [
            'No. You can use the app without an account and save recipes locally on your device.',
            "Create an account if you'd like to upgrade and sync your library across devices.",
          ],
        },
        {
          id: 'offline',
          question: 'Does the app work offline?',
          answers: [
            'Yes. You can create, edit, and view recipes without an internet connection.',
            'Imports from Dropbox, Drive, iCloud, and similar providers must be available offline or downloaded to your phone before you can import them.',
            'If you have Premium, changes sync automatically when you reconnect.',
          ],
        },
        {
          id: 'add-first-recipe',
          question: 'How do I add my first recipe?',
          answers: [
            "Tap the '+' button in the tab bar, then choose 'Recipe'.",
            'You can type it manually or import a PDF or image.',
          ],
        },
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
            "If you reach the recipe or storage limit, you won't be able to add new recipes or imports until you free up space or upgrade to Premium.",
            'Your existing content remains accessible.',
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
  ],
  es: [
    {
      id: 'getting-started',
      title: 'Primeros pasos',
      items: [
        {
          id: 'account-use',
          question: '¿Necesito una cuenta para usar la app?',
          answers: [
            'No. Puedes usar la app sin cuenta y guardar recetas localmente en tu dispositivo.',
            'Crea una cuenta si quieres pasarte a Premium y sincronizar tu biblioteca entre dispositivos.',
          ],
        },
        {
          id: 'offline',
          question: '¿La app funciona sin conexión?',
          answers: [
            'Sí. Puedes crear, editar y ver recetas sin conexión a internet.',
            'Las importaciones desde Dropbox, Drive, iCloud y proveedores similares deben estar disponibles sin conexión o descargadas en tu teléfono antes de importarlas.',
            'Si tienes Premium, los cambios se sincronizan automáticamente cuando vuelvas a conectarte.',
          ],
        },
        {
          id: 'add-first-recipe',
          question: '¿Cómo añado mi primera receta?',
          answers: [
            "Toca el botón '+' de la barra de pestañas y después elige 'Receta'.",
            'Puedes escribirla manualmente o importar un PDF o una imagen.',
          ],
        },
        {
          id: 'collections',
          question: '¿Cómo funcionan las colecciones?',
          answers: [
            'Las colecciones son tu biblioteca principal. Incluyen tus recetas, importaciones, notas y lista de compras.',
            'Puedes agrupar recetas en carpetas para organizarlas por categoría, cocina u ocasión.',
          ],
        },
      ],
    },
    {
      id: 'account-data',
      title: 'Cuenta y datos',
      items: [
        {
          id: 'free-plan-limits',
          question: '¿Cuáles son los límites del plan gratuito?',
          answers: [
            'El plan gratuito incluye:',
            '• Hasta 100 recetas',
            '• Hasta 10 MB por archivo importado (PDF o imagen)',
            '• Hasta 50 MB de almacenamiento total para importaciones e imágenes',
            '• Notas ilimitadas',
            '• Acceso completo sin conexión en este dispositivo',
            'Los archivos en la nube deben seguir estando disponibles sin conexión o descargados localmente antes de importarlos.',
            'Puedes mejorar tu plan en cualquier momento para eliminar los límites de recetas y almacenamiento y activar la sincronización en la nube.',
          ],
        },
        {
          id: 'free-plan-reach',
          question: '¿Qué pasa si llego al límite del plan gratuito?',
          answers: [
            'Si llegas al límite de recetas o almacenamiento, no podrás añadir nuevas recetas o importaciones hasta liberar espacio o pasarte a Premium.',
            'Tu contenido actual seguirá siendo accesible.',
          ],
        },
        {
          id: 'free-plan-device-space',
          question: '¿Por qué puedo guardar más recetas, notas o importaciones si todavía no he alcanzado los límites del plan gratuito?',
          answers: [
            'Los límites del plan gratuito son límites de la app, pero tu dispositivo también necesita espacio disponible para guardar nuevos datos.',
            'Si tu teléfono tiene poco espacio, las importaciones o imágenes pueden fallar aunque todavía no hayas alcanzado los límites de tu plan.',
            'Prueba a liberar espacio en el dispositivo y vuelve a importar.',
          ],
        },
        {
          id: 'no-upgrade',
          question: '¿Qué pasa si no mejoro mi plan?',
          answers: [
            'Tus recetas seguirán guardadas de forma segura en este dispositivo.',
            'Si desinstalas la app o cambias de dispositivo sin Premium, tus recetas no se transferirán automáticamente.',
            'Puedes pasarte a Premium en cualquier momento para sincronizarlas.',
          ],
        },
        {
          id: 'upgrade-premium-data',
          question: '¿Qué pasa cuando me paso a Premium?',
          answers: [
            'Importamos automáticamente a tu cuenta todas las recetas, notas y carpetas de este dispositivo.',
            'A partir de ese momento, todo se mantendrá sincronizado entre tus dispositivos.',
            'No se sobrescribe nada. No se elimina nada.',
          ],
        },
        {
          id: 'cancel-premium-data',
          question: '¿Qué pasa si cancelo Premium?',
          answers: [
            'Tus datos sincronizados seguirán guardados de forma segura en tu cuenta.',
            'La sincronización se detiene al final de tu suscripción.',
            'Los cambios nuevos se quedarán en tu dispositivo salvo que renueves.',
          ],
        },
        {
          id: 'change-phones',
          question: '¿Qué pasa si cambio de teléfono?',
          answers: [
            'Con Premium, instala la app e inicia sesión. Tus recetas se sincronizarán automáticamente.',
            'Sin Premium, tus recetas seguirán en tu dispositivo original.',
          ],
        },
        {
          id: 'recipes-private',
          question: '¿Mis recetas son privadas?',
          answers: [
            'Sí. Tus recetas y archivos son privados para tu cuenta.',
            'No accedemos ni compartimos tu contenido personal.',
          ],
        },
        {
          id: 'change-email',
          question: '¿Cómo cambio mi correo o mi nombre?',
          answers: [
            'Ve a la configuración de tu perfil para actualizar la información de tu cuenta.',
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
          question: '¿Qué incluye Premium?',
          answers: [
            'Premium elimina los límites del plan gratuito y activa una sincronización segura en la nube.',
            'Incluye:',
            '• Recetas ilimitadas',
            '• Sincronización entre dispositivos',
            '• Imágenes (PNG, JPG)',
            '• PDFs importados',
            '• Notas y carpetas',
            'Cuando te pasas a Premium, importamos automáticamente todo lo que ya habías creado en este dispositivo.',
            'La app sigue siendo totalmente usable sin conexión una vez que el archivo se ha guardado en este dispositivo. Los proveedores en la nube como Dropbox siguen necesitando que el archivo seleccionado esté disponible localmente antes de importarlo.',
          ],
        },
        {
          id: 'storage-limit',
          question: '¿Hay un límite de almacenamiento con Premium?',
          answers: [
            'Premium incluye:',
            '• Hasta 10 MB por archivo (PDF o imagen)',
            '• 5 GB de almacenamiento total para tu biblioteca',
            '• Recetas y notas ilimitadas',
            'Si alguna vez te acercas al límite, te avisaremos.',
          ],
        },
        {
          id: 'subscription-multiple-devices',
          question: '¿Puedo usar Premium en varios dispositivos?',
          answers: [
            'Sí. Siempre que inicies sesión con la misma cuenta, tu biblioteca sincronizada estará disponible en todos tus dispositivos.',
          ],
        },
      ],
    },
    {
      id: 'billing',
      title: 'Facturación',
      items: [
        {
          id: 'upgrade',
          question: '¿Cómo me paso a Premium?',
          answers: [
            'Ve a la pestaña de Perfil y selecciona Premium.',
            'Elige mensual o anual y confirma a través de la tienda de aplicaciones.',
          ],
        },
        {
          id: 'cancel',
          question: '¿Puedo cancelar mi suscripción?',
          answers: [
            'Sí. Puedes cancelarla en cualquier momento desde los ajustes de suscripciones de Apple o Google.',
            'Premium seguirá activo hasta el final de tu periodo de facturación.',
          ],
        },
        {
          id: 'switch-plan',
          question: '¿Puedo cambiar entre el plan mensual y anual?',
          answers: [
            'Sí. Puedes cambiar en cualquier momento desde los ajustes de suscripción de tu tienda de aplicaciones.',
          ],
        },
      ],
    },
    {
      id: 'features',
      title: 'Funciones',
      items: [
        {
          id: 'shopping-list',
          question: '¿Para qué sirve la lista de compras?',
          answers: [
            'La lista de compras reúne los ingredientes de tus recetas en un solo lugar para que puedas ir marcando artículos mientras compras.',
          ],
        },
        {
          id: 'share-recipes',
          question: '¿Puedo compartir recetas?',
          answers: [
            'Sí. Abre cualquier receta y toca el icono de compartir.',
            'Puedes exportarla como archivo .txt o compartirla directamente como texto plano.',
          ],
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: 'Solución de problemas',
      items: [
        {
          id: 'import-issue',
          question: 'Mi receta no se importó correctamente',
          answers: [
            'Prueba a importarla de nuevo con una fuente más clara.',
            'Siempre puedes editar la receta manualmente para corregir campos que falten.',
          ],
        },
        {
          id: 'app-slow',
          question: 'La app va lenta',
          answers: [
            'Cierra y vuelve a abrir la app.',
            'Asegúrate de que tu dispositivo tiene suficiente almacenamiento libre y una conexión estable a internet.',
          ],
        },
      ],
    },
  ],
}

export function getFaqSections(locale?: string | null): FaqSection[] {
  return locale?.toLowerCase().startsWith('es')
    ? FAQ_SECTIONS_BY_LOCALE.es
    : FAQ_SECTIONS_BY_LOCALE.en
}

export const FAQ_SECTIONS = FAQ_SECTIONS_BY_LOCALE.en
