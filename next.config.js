const { ensureAppUrl } = require("./lib/runtimeConfig");

// NextAuth reads NEXTAUTH_URL. On Vercel that is the deployment URL; locally
// it falls back to http://localhost:3000 when the env var is missing.
ensureAppUrl();

/** @type {import('next').NextConfig} */

// The app used to route through /Components/*; keep old links working.
const legacyRedirects = [
  ["/Components/Home", "/"],
  ["/Login/Login", "/login"],
  ["/Register/Registration", "/register"],
  ["/Components/Attendance", "/attendance"],
  ["/Components/Assignments", "/assignments"],
  ["/Components/Test", "/tests"],
  ["/Components/GenerateMarksheet", "/results"],
  ["/Components/GenerateTimeTable", "/timetable/build"],
  ["/Components/StudentSection/studentHome", "/dashboard"],
  ["/Components/StudentSection/Marksheet", "/results"],
  ["/Components/StudentSection/Assignment", "/assignments"],
  ["/Components/StudentSection/generateNotes", "/notes"],
  ["/Components/StudentSection/UpcomingTest", "/tests"],
  ["/Components/StudentSection/ShowTimeTable", "/timetable"],
];

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        dns: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
