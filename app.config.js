// Same codebase ships as two single-museum sites — metroulette.com and
// momaroulette.com — picked at build time via EXPO_PUBLIC_SITE. Local dev
// (EXPO_PUBLIC_SITE unset) defaults to the Met and shows every museum tab.
const SITE = process.env.EXPO_PUBLIC_SITE;

const SITES = {
  met: {
    name: "Met Roulette",
    scheme: "metroulette",
    // TODO: replace with a real Met favicon if this placeholder is wrong.
    favicon: "./assets/images/favicon.png",
  },
  moma: {
    name: "MoMA Roulette",
    scheme: "momaroulette",
    // TODO: swap for the real MoMA favicon — currently a copy of the Met one.
    favicon: "./assets/images/favicon-moma.png",
  },
};

const site = SITES[SITE] ?? SITES.met;

module.exports = {
  expo: {
    name: site.name,
    slug: "met-roulette",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: site.scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: site.favicon,
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-font",
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
