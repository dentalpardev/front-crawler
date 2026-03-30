import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const appThemePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{gray.50}',
          100: '{gray.100}',
          200: '{gray.200}',
          300: '{gray.300}',
          400: '{gray.400}',
          500: '{gray.500}',
          600: '{gray.600}',
          700: '{gray.700}',
          800: '{gray.800}',
          900: '{gray.900}',
          950: '{gray.950}',
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.0}',
          filledHoverBackground: '{surface.0}',
          filledFocusBackground: '{surface.0}',
          borderColor: '{surface.300}',
          hoverBorderColor: '{surface.400}',
          focusBorderColor: '{primary.color}',
          color: '{surface.950}',
          placeholderColor: '{surface.500}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{gray.50}',
          100: '{gray.100}',
          200: '{gray.200}',
          300: '{gray.300}',
          400: '{gray.400}',
          500: '{gray.500}',
          600: '{gray.600}',
          700: '{gray.700}',
          800: '{gray.800}',
          900: '{gray.900}',
          950: '{gray.950}',
        },
        formField: {
          background: '{surface.900}',
          disabledBackground: '{surface.800}',
          filledBackground: '{surface.900}',
          filledHoverBackground: '{surface.900}',
          filledFocusBackground: '{surface.900}',
          borderColor: '{surface.700}',
          hoverBorderColor: '{surface.600}',
          focusBorderColor: '{primary.color}',
          color: '{surface.0}',
          placeholderColor: '{surface.400}',
        },
      },
    },
  },
  components: {
    card: {
      root: {
        shadow: '0 0 0 1px {surface.200}, 0 12px 32px rgba(15, 23, 42, 0.08)',
      },
      colorScheme: {
        light: {
          root: {
            background: '{surface.0}',
            color: '{surface.950}',
            shadow: '0 0 0 1px {surface.200}, 0 12px 32px rgba(15, 23, 42, 0.08)',
          },
          subtitle: {
            color: '{surface.500}',
          },
        },
        dark: {
          root: {
            background: '{surface.800}',
            color: '{surface.0}',
            shadow: '0 0 0 1px {surface.700}, 0 18px 40px rgba(0, 0, 0, 0.32)',
          },
          subtitle: {
            color: '{surface.300}',
          },
        },
      },
    },
  },
})

export const primeVueOptions = {
  ripple: true,
  inputVariant: 'filled',
  unstyled: false,
  theme: {
    preset: appThemePreset,
    options: {
      prefix: 'p',
      darkModeSelector: '.app-dark',
      cssLayer: false,
    },
  },
}
