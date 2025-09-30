import { useEffect } from "react";
import { useLocation } from "wouter";
import { getRoutingComponent, canHandleRoute } from "supertokens-auth-react/ui";
import { ThirdPartyPreBuiltUI } from "supertokens-auth-react/recipe/thirdparty/prebuiltui";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import { EmailVerificationPreBuiltUI } from "supertokens-auth-react/recipe/emailverification/prebuiltui";
import Session from "supertokens-auth-react/recipe/session";

const PreBuiltUIList = [
  ThirdPartyPreBuiltUI,
  PasswordlessPreBuiltUI,
  EmailVerificationPreBuiltUI,
];

export default function Auth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    async function checkSession() {
      try {
        const sessionExists = await Session.doesSessionExist();
        if (sessionExists) {
          setLocation('/dashboard');
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }
    checkSession();
  }, [setLocation]);

  // Check if SuperTokens can handle the current route
  if (canHandleRoute(PreBuiltUIList)) {
    return getRoutingComponent(PreBuiltUIList);
  }

  // Default auth UI - render SuperTokens components
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-lg border rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary text-primary-foreground rounded-lg p-3">
                <i className="fas fa-file-contract text-2xl"></i>
              </div>
            </div>
            <h2 className="text-center text-3xl font-bold text-foreground">
              Welcome to Kontracts
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Sign in to access your contract management dashboard
            </p>
          </div>
          <div className="mt-8">
            {getRoutingComponent(PreBuiltUIList)}
          </div>
        </div>
      </div>
    </div>
  );
}