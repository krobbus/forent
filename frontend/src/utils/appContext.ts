import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Role } from './props';

export interface AppContextValue {
  userId: number | null;
  userRole: Role;
  setUserId: Dispatch<SetStateAction<number | null>>;
  setUserRole: Dispatch<SetStateAction<Role>>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppContext.Provider');
  return context;
}
