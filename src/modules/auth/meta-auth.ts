import {
  ApiVersion,
  CreateMetaAuth,
  FieldsPage,
  GetAccounts,
} from "../../interfaces/meta-auth";
import {
  CreateAccessTokenResponse,
  FacebookAdAccount,
  FacebookPage,
  GetAlongTokenMetaResponse,
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
    ).data;

    return {
      accessToken: accessToken.access_token,
      getAccounts: ({ fields }: { fields: FieldsPage }) => {
        return MetaAuth.getAccountsWithIgToken({
          fields,
          accessToken: accessToken.access_token,
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

    const shortAccessToken = (
      await api.post<CreateAccessTokenResponse>(`/oauth/access_token`, {
        client_id,
        client_secret,
        code,
        redirect_uri,
      })
    ).data.access_token;

    const longAccessToken = await this.extendUserAccessToken({
      client_id,
      client_secret,
      accessToken: shortAccessToken,
      apiVersion,
    });

    return {
      accessToken: longAccessToken,
      getAccounts: ({ fields }: { fields: FieldsPage }) => {
        return MetaAuth.getAccountsWithFbToken({
          fields,
          accessToken: longAccessToken,
          apiVersion,
        });
      },
      getAdAccounts: () => {
        return MetaAuth.getAdAccounts({
          accessToken: longAccessToken,
          apiVersion,
        });
      },
    };
  }

  public static async extendUserAccessToken({
    client_id,
    client_secret,
    accessToken,
    apiVersion,
  }: {
    client_id: string;
    client_secret: string;
    accessToken: string;
    apiVersion: ApiVersion;
  }) {
    const api = generateAxiosInstance({ apiVersion });

    const response = await api.get<GetAlongTokenMetaResponse>(
      "/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id,
          client_secret,
          fb_exchange_token: accessToken,
        },
      },
    );

    return response.data.access_token;
  }

  public static async getAccountsWithFbToken({
    fields,
    accessToken,
    apiVersion,
  }: GetAccounts): Promise<FacebookPage[]> {
    const api = generateAxiosInstance({ apiVersion });

    const allAccounts: FacebookPage[] = [];
    let afterCursor: string | undefined = undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await api.get<GetPageAccountsResponse>(`/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: fields.join(","),
          after: afterCursor,
        },
      });

      const { data, paging } = response.data;
      allAccounts.push(...data);

      afterCursor = paging?.cursors?.after;
      hasNextPage = Boolean(afterCursor);
    }

    return allAccounts;
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

  public static async generateIgLongToken({
    accessToken,
    apiVersion,
    clientSecret,
  }: {
    accessToken: string;
    apiVersion: ApiVersion;
    clientSecret: string;
  }): Promise<string> {
    const api = generateAxiosInstance({ apiVersion, isInstagramApi: true });

    return (
      await api.get<GetAlongTokenMetaResponse>("/access_token", {
        params: {
          client_secret: clientSecret,
          access_token: accessToken,
          grant_type: "ig_exchange_token",
        },
      })
    ).data.access_token;
  }

  public static async generateIgRefreshToken({
    accessToken,
    apiVersion,
  }: {
    accessToken: string;
    apiVersion: ApiVersion;
  }): Promise<string> {
    const api = generateAxiosInstance({ apiVersion, isInstagramApi: true });

    return (
      await api.get<GetAlongTokenMetaResponse>("/access_token", {
        params: {
          access_token: accessToken,
          grant_type: "ig_refresh_token",
        },
      })
    ).data.access_token;
  }
}
