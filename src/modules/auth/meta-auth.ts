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
} from "../../interfaces/meta-response";
import { generateAxiosInstance } from "../../utils/api";

export class MetaAuth {
  public static async createAccessToken({
    client_id,
    client_secret,
    redirect_uri,
    apiVersion,
    code,
  }: CreateMetaAuth) {
    const api = generateAxiosInstance(apiVersion);

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
        return MetaAuth.getAccounts({ fields, accessToken, apiVersion });
      },
      getAdAccounts: () => {
        return MetaAuth.getAdAccounts({ accessToken, apiVersion });
      },
    };
  }

  public static async getAccounts({
    fields,
    accessToken,
    apiVersion,
  }: GetAccounts): Promise<FacebookPage[]> {
    const api = generateAxiosInstance(apiVersion);

    return (
      await api.get<GetPageAccountsResponse>(`/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: fields.join(","),
        },
      })
    ).data.data;
  }

  public static async getAdAccounts({
    accessToken,
    apiVersion,
  }: Omit<GetAccounts, "fields">): Promise<FacebookPage[]> {
    const api = generateAxiosInstance(apiVersion);

    return (
      await api.get<FacebookAdAccount>(`/me/adaccounts`, {
        params: {
          access_token: accessToken,
        },
      })
    ).data.data;
  }
}
