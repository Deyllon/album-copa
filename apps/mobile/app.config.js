const appJson = require("./app.json");

module.exports = () => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    appJson.expo.extra?.apiBaseUrl ||
    "http://127.0.0.1:3000";

  return {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      apiBaseUrl,
    },
  };
};
