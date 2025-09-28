import ThirdParty, { Google, Github } from "supertokens-auth-react/recipe/thirdparty";
import Passwordless from "supertokens-auth-react/recipe/passwordless";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";

export function getApiDomain() {
    const apiPort = import.meta.env.VITE_API_PORT || 3000;
    const apiUrl = import.meta.env.NODE_ENV === 'production'
        ? `https://your-production-domain.com`
        : `http://localhost:${apiPort}`;
    return apiUrl;
}

export function getWebsiteDomain() {
    const websitePort = 5173;
    const websiteUrl = import.meta.env.NODE_ENV === 'production'
        ? `https://your-production-domain.com`
        : `http://localhost:${websitePort}`;
    return websiteUrl;
}

export const SuperTokensConfig = {
    appInfo: {
        appName: "Kontracts",
        apiDomain: getApiDomain(),
        websiteDomain: getWebsiteDomain(),
        apiBasePath: "/auth",
        websiteBasePath: "/auth",
    },
    recipeList: [
        ThirdParty.init({
            signInAndUpFeature: {
                providers: [
                    Google.init(),
                    Github.init(),
                ],
            },
        }),
        Passwordless.init({
            contactMethod: "EMAIL"
        }),
        EmailVerification.init({
            mode: "REQUIRED"
        }),
        Session.init()
    ],
    getRedirectionURL: async (context: any) => {
        if (context.action === "SUCCESS" && context.newSessionCreated) {
            return "/dashboard";
        }
        return undefined;
    },
};