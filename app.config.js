const base = require('./app.json');

/** @type {import('@expo/config').ExpoConfig} */
module.exports = () => ({
  ...base,
  expo: {
    ...base.expo,
    plugins: [
      ...base.expo.plugins,
      ...(process.env.EXPO_PUBLIC_IAP_PLUS === '1' ? ['expo-iap'] : []),
    ],
  },
});
