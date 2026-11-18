// Dev-only: links the Expo Go preview to the owner's Expo project so a
// signed-in Expo Go accepts the (signed) dev manifest. Only active when the
// dev server is started with EXPO_DEV_EAS_PROJECT_ID set; app.json and the
// platform-managed `extra` values are left exactly as they are otherwise.
module.exports = ({ config }) => {
  const projectId = process.env.EXPO_DEV_EAS_PROJECT_ID;
  if (!projectId) return config;
  return {
    ...config,
    owner: process.env.EXPO_DEV_OWNER || config.owner,
    extra: { ...config.extra, eas: { ...config.extra?.eas, projectId } },
  };
};
