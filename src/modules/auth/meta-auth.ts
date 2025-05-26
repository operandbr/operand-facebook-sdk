import { AxiosError } from "axios";
import {
  CreateMetaAuth,
  FieldsPage,
  GetAccounts,
} from "../../interfaces/meta-auth";
import {
  CreateAccessTokenResponse,
  FacebookAdAccount,
  FacebookPage,
  GetPageAccountsResponse,
  InstagramAccount,
} from "../../interfaces/meta-response";
import { generateAxiosInstance } from "../../utils/api";

export class MetaAuth {
  public static async createAccessTokenIg({
    client_id,
    client_secret,
    redirect_uri,
    apiVersion,
    code,
  }: CreateMetaAuth) {
    const api = generateAxiosInstance({
      apiVersion: "v21.0",
      isInstagramAccessToken: true,
    });

    const data = new URLSearchParams();

    data.append("client_id", client_id);
    data.append("client_secret", client_secret);
    data.append("grant_type", "authorization_code");
    data.append("redirect_uri", redirect_uri);
    data.append("code", code);

    const accessToken = (
      await api.post<CreateAccessTokenResponse>(`/oauth/access_token`, data)
    ).data.access_token;

    return {
      accessToken,
      getAccounts: ({ fields }: { fields: FieldsPage }) => {
        return MetaAuth.getAccountsWithIgToken({
          fields,
          accessToken,
          apiVersion,
        });
      },
    };
  }

  public static async createAccessTokenFb({
    client_id,
    client_secret,
    redirect_uri,
    apiVersion,
    code,
  }: CreateMetaAuth) {
    const api = generateAxiosInstance({ apiVersion });

    const accessToken = (
      await api.post<CreateAccessTokenResponse>(`/oauth/access_token`, {
        client_id,
        client_secret,
        code,
        redirect_uri,
      })
    ).data.access_token;

    return {
      accessToken,
      getAccounts: ({ fields }: { fields: FieldsPage }) => {
        return MetaAuth.getAccountsWithFbToken({
          fields,
          accessToken,
          apiVersion,
        });
      },
      getAdAccounts: () => {
        return MetaAuth.getAdAccounts({ accessToken, apiVersion });
      },
    };
  }

  public static async getAccountsWithFbToken({
    fields,
    accessToken,
    apiVersion,
  }: GetAccounts): Promise<FacebookPage[]> {
    const api = generateAxiosInstance({ apiVersion });

    return (
      await api.get<GetPageAccountsResponse>(`/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: fields.join(","),
        },
      })
    ).data.data;
  }

  public static async getAccountsWithIgToken({
    fields,
    accessToken,
    apiVersion,
  }: GetAccounts): Promise<InstagramAccount> {
    const api = generateAxiosInstance({ apiVersion, isInstagramApi: true });

    return (
      await api.get<InstagramAccount>(`/me`, {
        params: {
          access_token: accessToken,
          fields: fields.join(","),
        },
      })
    ).data;
  }

  public static async getAdAccounts({
    accessToken,
    apiVersion,
  }: Omit<GetAccounts, "fields">): Promise<FacebookPage[]> {
    const api = generateAxiosInstance({ apiVersion });

    return (
      await api.get<FacebookAdAccount>(`/me/adaccounts`, {
        params: {
          access_token: accessToken,
        },
      })
    ).data.data;
  }
}

(async () => {
  try {
    // const teste = await MetaAuth.createAccessTokenIg({
    //   apiVersion: "v21.0",
    //   client_secret: "db3412e538acb90ea569f9445948b936",
    //   client_id: "1351995606028633",
    //   code: "AQB-ZxsqAszEYyi5HKLGkDKSflOwAVrZxIV2PXj987iKzvHN03-Lm-_GYCpsvLVzFLMXAU4I9UclvmEO5D1YZDLxUZ5Uk5wz2V_jwcBF1_D-8XK3BD-Nm6ck1TOT9qSh7W9IWZ7r1eSbl1SHQuc6ogEGZw4-4re-PRkJKMcHQVae_m_AlqvWrDDCdwS99MgpV-J_PxvXLA0nB2QqmPg6YHgmYRrqs0yVIdochCU8Hz9iVA#_",
    //   redirect_uri:
    //     "https://8e77-2804-4288-c1e9-2b00-ddbc-3a5e-9f48-706c.ngrok-free.app/",
    // });

    const teste = await MetaAuth.getAccountsWithIgToken({
      apiVersion: "v21.0",
      accessToken:
        "IGAATNogHV0VlBZAE12UXRpQ0JReDliUlp5MzYxQjNCTW5XRGZAEWnlqdWdYRFV0bFQ4WHNGVU5OWGpDVkVSamtkcUJxY0c3ejFNWWJUVDFubkRhV1ExVlRHbk1hbFRVWHE4V3JKMnNxSWxRSFNkN1JxRUJzb1NfM25qRGh0UUVZAeUdaZADNTZAXJKbkdLawZDZD",
      fields: ["id", "username", "name", "followers_count"],
    });

    console.log({ teste });
  } catch (error) {
    console.log((error as AxiosError)?.response.data);
  }
})();
