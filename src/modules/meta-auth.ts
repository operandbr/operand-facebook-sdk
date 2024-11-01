import { CreateMetaAuth } from "../interfaces/main";
import { CreateAccessTokenResponse } from "../interfaces/meta";
import { generateAxiosInstance } from "../utils/api";

export class MetaAuth {
  public static async createAccessToken({
    client_id,
    client_secret,
    redirect_uri,
    apiVersion,
    code,
  }: CreateMetaAuth): Promise<string> {
    const api = generateAxiosInstance(apiVersion);

    return (
      await api.post<CreateAccessTokenResponse>(`/oauth/access_token`, {
        client_id,
        client_secret,
        code,
        redirect_uri,
      })
    ).data.access_token;
  }
}
