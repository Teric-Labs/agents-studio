import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('Auth state changed:', currentUser?.email);
      setUser(currentUser);
      
      // Save Firebase token to localStorage
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('firebase_token', token);
        localStorage.setItem('firebase_uid', currentUser.uid);
      } else {
        localStorage.removeItem('firebase_token');
        localStorage.removeItem('firebase_uid');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const signUp = async (email: string, password: string) => {
    await auth.createUserWithEmailAndPassword(email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  };

  const signOutUser = async () => {
    await auth.signOut();
  };

  const getAuthToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut: signOutUser,
      getIdToken: getAuthToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
