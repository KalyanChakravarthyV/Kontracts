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
        const sessionExists = await Session.doesSessionExist();
        setHasSession(sessionExists);

        // If no session and not on auth pages, redirect to auth
        if (!sessionExists && !location.startsWith('/auth')) {
          setLocation('/auth');
        }

        // If has session and on auth pages, redirect to dashboard
        if (sessionExists && location.startsWith('/auth')) {
          setLocation('/dashboard');
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setHasSession(false);
        if (!location.startsWith('/auth')) {
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

  return <>{children}</>;
}