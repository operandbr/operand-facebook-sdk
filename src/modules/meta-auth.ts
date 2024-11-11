import {
  CreateMetaAuth,
  FieldsPage,
  GetAccounts,
} from "../interfaces/meta-auth";
import {
  CreateAccessTokenResponse,
  FacebookPage,
  GetPageAccountsResponse,
} from "../interfaces/meta-response";
import { generateAxiosInstance } from "../utils/api";

export class MetaAuth {
  public static async createAccessToken({
    client_id,
    client_secret,
    redirect_uri,
    apiVersion,
    code,
  }: CreateMetaAuth): Promise<{
    accessToken: string;
    getAccounts: ({
      fields,
    }: {
      fields: FieldsPage;
    }) => Promise<FacebookPage[]>;
  }> {
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
        return MetaAuth.getAccounts({ fields, accessToken });
      },
    };
  }

  public static async getAccounts({
    fields,
    accessToken,
  }: GetAccounts): Promise<FacebookPage[]> {
    const api = generateAxiosInstance("v21.0");

    return (
      await api.get<GetPageAccountsResponse>(`/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: fields.join(","),
        },
      })
    ).data.data;
  }
}
