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
