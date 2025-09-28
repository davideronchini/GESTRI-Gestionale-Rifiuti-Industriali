/**
 * GESTRI - Theme system
 * Colors, variables, and theme configuration for the application
 */

// Colors tokens
export const colors = {
  // Brand colors
  primary: {
    1: '#e4f6e9',
    2: '#caedd3',
    3: '#aee4be',
    4: '#92daa8',
    5: '#73d093',
    6: '#50c67f',
    7: '#17bc6a',
    8: '#1f9355',
    9: '#1f6d40',
    10: '#1b482c',
    11 : '#13271a',
  },
  
  // UI elements
  dark: {
    1: '#e5e5e5',
    2: '#cbcbcb',
    3: '#b2b2b2',
    4: '#999a9a',
    5: '#818282',
    6: '#6a6b6b',
    7: '#545555',
    8: '#3f4040',
    9: '#2b2c2c',
    10: '#181919',
    11 : '#0e0f0f',
  },
  
  light: {
    1: '#ffffff',
    2: '#ffffff',
    3: '#e2e2e2',
    4: '#c6c6c6',
    5: '#ababab',
    6: '#919191',
    7: '#777777',
    8: '#5e5e5e',
    9: '#474747',
    10: '#303030',
    11 : '#1b1b1b',
  },
  
  // Semantic colors
  success: '#17BC6A',
  info: '#0ea5e9',
  warning: '#f59e0b',
  error: '#ef4444',

  // Custom
  overlay: {
    light: 'rgba(248, 249, 250, 0.85)',
    dark: 'rgba(0, 0, 0, 0.75)'
  },
};

// Container size presets
export const sizes = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1400,
};

// Spacing scale (following Mantine's defaults)
export const spacing = {
  xs: '0.625rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem',
};

// Component-specific tokens
export const components = {
  appPaper: {
    light: {
      bg: 'rgba(0, 0, 0, 0.7)',
      gradientOverlay: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15))',
      backdropBlur: '15px',
      border: '0px solid rgba(255, 255, 255, 0.2)',
    },
    dark: {
      bg: 'rgba(0, 0, 0, 0.7)',
      gradientOverlay: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15))',
      backdropBlur: '15px',
      border: '0px solid rgba(255, 255, 255, 0.2)',
    },
  },
  appTextInput: {
    light: {
      bg: 'rgba(255, 255, 255, 0.85)',
      border: '0px solid rgba(0, 0, 0, 0.1)',
      focusBorder: '1px solid #17BC6A',
      color: 'rgba(44, 44, 44, 0.6)'
    },
    dark: {
      bg: 'rgba(255, 255, 255, 0.85)',
      border: '0px solid rgba(0, 0, 0, 0.1)',
      focusBorder: '1px solid #17BC6A',
      color: 'rgba(44, 44, 44, 0.6)'
    },
  },
  appSubmitButton: {
    light: {
      bg: '#17BC6A',
      color: '#ffffff',
      hoverBg: '#15a85e',
    },
    dark: {
      bg: '#17BC6A',
      color: '#ffffff',
      hoverBg: '#15a85e',
    },
  },
  appSmallText: {
    light: {
      color: '#B0B3BA',
    },
    dark: {
      color: '#B0B3BA',
    },
  },
  appLargeText: {
    light: {
      color: 'rgba(44, 44, 44, 1)',
    },
    dark: {
      color: '#ffffffff',
    },
  },
  appIcon: {
    light: {
      color: 'rgba(44, 44, 44, 1)',
    },
    dark: {
      color: '#ffffff',
    },
  },
  appNavLink: {
    light: {
      color: '#6a6b6b',
      hoverColor: '#17BC6A',
      activeBg: 'rgba(23, 188, 106, 0.1)',
      hoverBg: 'rgba(23, 188, 106, 0.05)',
    },
    dark: {
      color: '#b2b2b2',
      hoverColor: '#17BC6A',
      activeBg: 'rgba(23, 188, 106, 0.15)',
      hoverBg: 'rgba(23, 188, 106, 0.08)',
    },
  },
};

// Text tokens
export const text = {
  normal: '15px',
  small: '13px',
  title: '20px',
  large: '23px',
  // Font weights
  medium: '600',
  regular: '400',
  bold: '800',
};

// Complete Mantine theme override
export const appTheme = {
  // Set primary color (used for buttons, links, etc)
  primaryColor: 'green',
  fontFamily: 'Poppins, sans-serif',
  
  // Custom colors defined above can be added to the palette
  colors: {
    // Add our primary color to Mantine's palette
    // Mantine expects an array of 10 values for each color
    green: [
      colors.primary[1],
      colors.primary[2],
      colors.primary[3],
      colors.primary[4],
      colors.primary[5],
      colors.primary[6],
      colors.primary[7],
      colors.primary[8],
      colors.primary[9],
      colors.primary[10],
    ],
  },

  // Components overrides
  components: {
    Button: {
      defaultProps: {
        color: 'green',
      }
    }
  },

  // Makes Mantine's theme available to our components
  other: {
    // Add our component-specific tokens
    components,
    // Add our sizes
    sizes,
    // Add our spacing
    spacing,
    // Add our text tokens
    text,
  },
};

export default appTheme;