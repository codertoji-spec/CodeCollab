import { createContext, useContext, useState, useEffect } from 'react';

const SecretContext = createContext();

const SECRET_CODE = 'wasd123';
const STORAGE_KEY = 'cc_secret_unlocked';

export function SecretProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });

  const checkCode = (input) => {
    if (!input) return false;
    if (input.trim() === SECRET_CODE) {
      setIsUnlocked(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const unlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <SecretContext.Provider value={{ isUnlocked, checkCode, lock, unlock, SECRET_CODE }}>
      {children}
    </SecretContext.Provider>
  );
}

export function useSecret() {
  return useContext(SecretContext);
}
