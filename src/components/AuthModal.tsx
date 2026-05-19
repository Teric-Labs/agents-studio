import React, { useState } from 'react';
import { Dialog, Flex, Text, Button, TextField, Box, Heading, Separator, Callout } from '@radix-ui/themes';
import { Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onOpenChange, mode = 'signin' }: AuthModalProps) {
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (currentMode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setCurrentMode(currentMode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Title style={{ display: 'none' }}>
        {currentMode === 'signin' ? 'Sign In' : 'Create Account'}
      </Dialog.Title>
      <Dialog.Description style={{ display: 'none' }}>
        Sign in or create an account to access phosai
      </Dialog.Description>
      <Dialog.Content style={{ maxWidth: '400px', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
        <Flex justify="between" align="center" mb="6">
          <Heading size="5" style={{ color: '#111827', fontWeight: 800 }}>
            {currentMode === 'signin' ? 'Sign In' : 'Create Account'}
          </Heading>
          <Dialog.Close>
            <Button variant="ghost" size="1">
              <X size={16} />
            </Button>
          </Dialog.Close>
        </Flex>

        {error && (
          <Callout.Root color="red" mb="4">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block', color: '#111827' }}>
                Email
              </Text>
              <TextField.Root
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              >
                <TextField.Slot>
                  <Mail size={16} />
                </TextField.Slot>
              </TextField.Root>
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block', color: '#111827' }}>
                Password
              </Text>
              <TextField.Root
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              >
                <TextField.Slot>
                  <Lock size={16} />
                </TextField.Slot>
              </TextField.Root>
            </Box>

            <Button
              type="submit"
              size="3"
              style={{ width: '100%', backgroundColor: '#f0ad44', color: '#211d1e', fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? 'Loading...' : currentMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </Flex>
        </form>

        <Separator size="4" my="6" />

        <Button
          variant="outline"
          size="3"
          style={{ width: '100%', borderColor: '#f0ad44', color: '#92400e' }}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', marginRight: '8px' }}>
            <path d="M21.6334 12.1873C21.6334 11.3679 21.5669 10.77 21.423 10.1499H12.0664V13.8482H17.5585C17.4479 14.7673 16.8499 16.1514 15.5211 17.0815L15.5025 17.2053L18.4609 19.4972L18.6659 19.5176C20.5482 17.7791 21.6334 15.2213 21.6334 12.1873Z" fill="#4285F4"></path>
            <path d="M12.0667 21.9312C14.7574 21.9312 17.0163 21.0453 18.6662 19.5173L15.5215 17.0812C14.6799 17.6681 13.5505 18.0777 12.0667 18.0777C9.43139 18.0777 7.19467 16.3393 6.39734 13.9365L6.28047 13.9464L3.20429 16.3271L3.16406 16.439C4.80284 19.6944 8.16902 21.9312 12.0667 21.9312Z" fill="#34A853"></path>
            <path d="M6.39782 13.9368C6.18744 13.3167 6.06568 12.6523 6.06568 11.9658C6.06568 11.2793 6.18744 10.6149 6.38675 9.99484L6.38118 9.86278L3.26645 7.44385L3.16454 7.49232C2.48912 8.84324 2.10156 10.3603 2.10156 11.9658C2.10156 13.5714 2.48912 15.0884 3.16454 16.4393L6.39782 13.9368Z" fill="#FBBC05"></path>
            <path d="M12.0667 5.85336C13.938 5.85336 15.2003 6.66168 15.9201 7.33718L18.7326 4.59107C17.0053 2.9855 14.7574 2 12.0667 2C8.16902 2 4.80284 4.23672 3.16406 7.49214L6.38628 9.99466C7.19467 7.59183 9.43139 5.85336 12.0667 5.85336Z" fill="#EB4335"></path>
          </svg>
          Continue with Google
        </Button>

        <Flex justify="center" mt="4">
          <Text size="2" style={{ color: '#111827' }}>
            {currentMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: '#f0ad44',
                cursor: 'pointer',
                fontWeight: 500,
                textDecoration: 'underline',
              }}
            >
              {currentMode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </Text>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
