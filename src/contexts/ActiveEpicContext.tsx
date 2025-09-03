import React, { createContext, useContext, useState, useEffect } from 'react';

interface ActiveEpicContextType {
  activeEpicId: string | null;
  setActiveEpicId: (epicId: string | null) => void;
}

const ActiveEpicContext = createContext<ActiveEpicContextType | undefined>(undefined);

interface ActiveEpicProviderProps {
  children: React.ReactNode;
}

export const ActiveEpicProvider: React.FC<ActiveEpicProviderProps> = ({ children }) => {
  const [activeEpicId, setActiveEpicId] = useState<string | null>(null);

  // Load active epic from localStorage on mount
  useEffect(() => {
    const savedEpicId = localStorage.getItem('activeEpicId');
    if (savedEpicId) {
      setActiveEpicId(savedEpicId);
    }
  }, []);

  // Save active epic to localStorage whenever it changes
  useEffect(() => {
    if (activeEpicId) {
      localStorage.setItem('activeEpicId', activeEpicId);
    } else {
      localStorage.removeItem('activeEpicId');
    }
  }, [activeEpicId]);

  const handleSetActiveEpicId = (epicId: string | null) => {
    setActiveEpicId(epicId);
  };

  return (
    <ActiveEpicContext.Provider
      value={{
        activeEpicId,
        setActiveEpicId: handleSetActiveEpicId,
      }}
    >
      {children}
    </ActiveEpicContext.Provider>
  );
};

export const useActiveEpic = (): ActiveEpicContextType => {
  const context = useContext(ActiveEpicContext);
  if (context === undefined) {
    throw new Error('useActiveEpic must be used within an ActiveEpicProvider');
  }
  return context;
};
