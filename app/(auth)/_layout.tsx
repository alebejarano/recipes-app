import { useAuth } from '@/features/auth/context/AuthContext';
import { Redirect, Slot } from 'expo-router';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // or splash screen

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
