import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
} from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          height: "80vh",
          backgroundImage: 'url("/demo.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
        }}
      >
        <Container>
        <Typography variant="h2" fontWeight="bold" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
            Welcome to Learn Linker
          </Typography>
          <Typography variant="h3" sx={{ mt: 2, fontWeight: 'medium', fontStyle: 'italic',}}>
  The <b>ultimate</b> coaching management system for <i>students</i> and <i>teachers</i>
</Typography>

          <Button variant="contained" sx={{ mt: 3 }}>
            <Link
              href="/Register/Registration"
              style={{ textDecoration: "none", color: "white" }}
            >
              Get Started
            </Link>
          </Button>
        </Container>
      </Box>

      <Container sx={{ py: 5 }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold">
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 3 }}>
          {[
            "Management",
            "Assignments & Tests",
            "Marks & Progress Tracking",
          ].map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" textAlign="center">
                    {feature}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
