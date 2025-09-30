import ThirdParty from "supertokens-node/recipe/thirdparty";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import UserRoles from "supertokens-node/recipe/userroles";
import EmailVerification from "supertokens-node/recipe/emailverification";
import Passwordless from "supertokens-node/recipe/passwordless";
import type { TypeInput } from "supertokens-node/types";

export function getApiDomain() {
    const apiPort = process.env.PORT || 3000;
    const apiUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.PRODUCTION_DOMAIN || 'kontracts.vadlakonda.in'}`
        : `http://localhost:${apiPort}`;
    return apiUrl;
}

export function getWebsiteDomain() {
    const websitePort = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 3000;
    const websiteUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.PRODUCTION_DOMAIN || 'kontracts.vadlakonda.in'}`
        : `http://localhost:${websitePort}`;
    return websiteUrl;
}

export const SuperTokensConfig: TypeInput = {
    supertokens: {
        connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || "https://try.supertokens.com",
        apiKey: process.env.SUPERTOKENS_API_KEY,
    },
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
                    {
                        config: {
                            thirdPartyId: "google",
                            clients: [
                                {
                                    clientId: process.env.GOOGLE_CLIENT_ID || "",
                                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
                                },
                            ],
                        },
                    },
                    {
                        config: {
                            thirdPartyId: "github",
                            clients: [
                                {
                                    clientId: process.env.GITHUB_CLIENT_ID || "",
                                    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
                                },
                            ],
                        },
                    },
                ],
            },
        }),
        Passwordless.init({
            contactMethod: "EMAIL",
            flowType: "USER_INPUT_CODE_AND_MAGIC_LINK"
        }),
        Dashboard.init(),
        UserRoles.init(),
        EmailVerification.init({
            mode: "REQUIRED"
        }),
        Session.init()
    ],
};