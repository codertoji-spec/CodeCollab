import { createContext, useContext, useState } from 'react';

const SecretContext = createContext();

const SECRET_CODE = 'wasd123';

export function SecretProvider({ children }) {
  // In-memory only state: locks immediately whenever the page/site is reloaded
  const [isUnlocked, setIsUnlocked] = useState(false);

  const checkCode = (input) => {
    if (!input) return false;
    if (input.trim() === SECRET_CODE) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
  };

  const unlock = () => {
    setIsUnlocked(true);
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

