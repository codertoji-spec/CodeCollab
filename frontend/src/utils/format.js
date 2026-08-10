export const formatUsername = (username) => {
  if (!username) return '';
  // Removes the automatically appended 4-character random suffix (e.g., _e3j8) from Google Sign-In
  let cleanName = username.replace(/_[a-z0-9]{4}$/i, '');
  
  // Replace underscores with spaces and capitalize the first letter of each word
  return cleanName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
