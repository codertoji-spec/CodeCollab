export const formatUsername = (username) => {
  if (!username) return '';
  // Removes the automatically appended 4-character random suffix (e.g., _e3j8) from Google Sign-In
  return username.replace(/_[a-z0-9]{4}$/i, '');
};
