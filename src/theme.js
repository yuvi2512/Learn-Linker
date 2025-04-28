// theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#9c27b0",
    },
    background: {
      paper: "#f5f5f5",
      default: "#e0f7fa",
    },
    text: {
      primary: "#0d47a1",
      secondary: "#424242",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h3: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            backgroundColor: "#ffffff",
            borderRadius: 8, // Rounded edges
            padding: "8px 12px",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)", 
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1976d2",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9c27b0",
          },
          "& .MuiInputLabel-root": {
            color: "#424242",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#1976d2",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Circular edges for buttons
          padding: "8px 24px", // Extra padding for a rounded, pill-shaped look
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Soft shadow
          textTransform: "none", // Remove uppercase transformation for a cleaner look
          "&:hover": {
            boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)", // Enhanced shadow on hover
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "1px solid #1976d2",
          borderRadius: 16, // Rounded edges for DataGrid container
          overflow: "hidden", // Ensures cells respect the rounded border
          "& .MuiDataGrid-cell": {
            color: "#0d47a1",
            borderRadius: 8, // Round edges on each cell
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#e3f2fd",
            color: "#0d47a1",
            fontWeight: "bold",
            borderRadius: "16px 16px 0 0", // Rounded top corners for header
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#f5f5f5",
            borderRadius: "0 0 16px 16px", // Rounded bottom corners for footer
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          animation: "fadeInUpZoomBounce 0.9s ease-out forwards",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          boxShadow: "0px 6px 14px rgba(0, 0, 0, 0.15)", 
          padding: "24px",
          "& .MuiCardHeader-title": {
            color: "#1976d2",
            fontWeight: "bold",
          },
          "& .MuiCardContent-root": {
            paddingTop: 0,
          },
          border: "1px solid rgba(0, 0, 0, 0.1)",
          transition: "box-shadow 0.3s ease",
          "&:hover": {
            boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.2)", 
          },
        },
      },
    },
  },
});

export default theme;
