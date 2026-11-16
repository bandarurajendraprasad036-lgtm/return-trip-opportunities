import { PhoneSignIn } from '@/components/PhoneSignIn';

// Compatibility adapter for existing bell callers; it never launches OAuth.
export function GoogleSignIn({ destination, returnTo }: { destination?: '/feed' | '/admin-login'; redirectPath?: '/' | '/admin-login'; returnTo?: string }) {
  return <PhoneSignIn destination={destination === '/admin-login' ? '/admin-login' : '/dashboard'} {...(returnTo ? { returnTo } : {})} />;
}