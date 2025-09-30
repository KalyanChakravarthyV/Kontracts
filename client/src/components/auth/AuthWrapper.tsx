import { useEffect, useState } from "react";
import { SuperTokensWrapper } from "supertokens-auth-react";
import Session from "supertokens-auth-react/recipe/session";
import { useLocation } from "wouter";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <SuperTokensWrapper>
      <SessionGate>
        {children}
      </SessionGate>
    </SuperTokensWrapper>
  );
}

interface SessionGateProps {
  children: React.ReactNode;
}

function SessionGate({ children }: SessionGateProps) {
  const [location, setLocation] = useLocation();
  const [sessionLoading, setSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        console.log('AuthWrapper: Checking session for location:', location);
        const sessionExists = await Session.doesSessionExist();
        console.log('AuthWrapper: Session exists:', sessionExists);
        setHasSession(sessionExists);

        // If no session and not on auth pages, redirect to auth
        if (!sessionExists && !location.startsWith('/auth')) {
          console.log('AuthWrapper: No session found, redirecting to auth');
          setLocation('/auth');
          return;
        }

        // If has session and on auth pages, redirect to dashboard
        if (sessionExists && location.startsWith('/auth')) {
          console.log('AuthWrapper: Has session, redirecting to dashboard');
          setLocation('/dashboard');
        }
      } catch (error) {
        console.error('AuthWrapper: Session check failed:', error);
        setHasSession(false);
        if (!location.startsWith('/auth')) {
          console.log('AuthWrapper: Error occurred, redirecting to auth');
          setLocation('/auth');
        }
      } finally {
        setSessionLoading(false);
      }
    }

    checkSession();
  }, [location, setLocation]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Only render children if user has a valid session and not on auth pages
  if (hasSession && !location.startsWith('/auth')) {
    return <>{children}</>;
  }

  // If on auth pages, always render (login/signup)
  if (location.startsWith('/auth')) {
    return <>{children}</>;
  }

  // No session and not on auth pages - redirect (this should not happen due to useEffect, but safety net)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}