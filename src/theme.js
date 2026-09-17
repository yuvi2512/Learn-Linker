import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563EB",
      light: "#60A5FA",
      dark: "#1D4ED8",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#0F766E",
      light: "#14B8A6",
      dark: "#115E59",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F4F7FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
    divider: "#E2E8F0",
    success: { main: "#059669" },
    error: { main: "#DC2626" },
    warning: { main: "#D97706" },
    info: { main: "#2563EB" },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.15 },
    h2: { fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: "-0.03em", fontSize: "1.75rem" },
    h4: { fontWeight: 700, letterSpacing: "-0.025em", fontSize: "1.5rem" },
    h5: { fontWeight: 650, letterSpacing: "-0.02em", fontSize: "1.2rem" },
    h6: { fontWeight: 650, letterSpacing: "-0.015em", fontSize: "1.05rem" },
    button: { fontWeight: 600, letterSpacing: 0, textTransform: "none" },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6, fontSize: "0.9rem" },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(15, 23, 42, 0.05)",
    "0 1px 3px rgba(15, 23, 42, 0.07), 0 1px 2px rgba(15, 23, 42, 0.04)",
    "0 4px 12px rgba(15, 23, 42, 0.06)",
    "0 8px 24px rgba(15, 23, 42, 0.08)",
    "0 12px 32px rgba(15, 23, 42, 0.1)",
    "0 16px 40px rgba(15, 23, 42, 0.12)",
    "0 20px 48px rgba(15, 23, 42, 0.14)",
    ...Array(17).fill("0 24px 56px rgba(15, 23, 42, 0.16)"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F4F7FB",
          color: "#0F172A",
        },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "#CBD5E1",
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 18px",
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundImage: "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)",
          "&:hover": {
            backgroundImage:
              "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)",
          },
        },
        outlined: {
          borderColor: "#CBD5E1",
          color: "#334155",
          backgroundColor: "#FFFFFF",
          "&:hover": {
            borderColor: "#94A3B8",
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "medium" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            "& fieldset": { borderColor: "#E2E8F0" },
            "&:hover fieldset": { borderColor: "#94A3B8" },
            "&.Mui-focused fieldset": { borderWidth: 1.5 },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid #E8EEF5",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          padding: 4,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 48,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#F8FAFC",
            color: "#334155",
            fontWeight: 700,
            borderBottom: "1px solid #E2E8F0",
          },
          "& .MuiDataGrid-cell": {
            color: "#0F172A",
            borderBottom: "1px solid #F1F5F9",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#F8FAFC",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#FAFBFC",
          },
          "& .MuiDataGrid-toolbarContainer": {
            padding: "12px 8px",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default theme;
