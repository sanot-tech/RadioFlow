import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<null>(null);
  const [isLoading] = useState(false);

  const signInWithGoogle = async () => {
    // Auth disabled — no-op
  };

  const signOut = async () => {
    // Auth disabled — no-op
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};