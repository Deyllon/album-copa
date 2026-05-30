const appJson = require("./app.json");

module.exports = () => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    appJson.expo.extra?.apiBaseUrl;

  return {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
    },
  };
};
