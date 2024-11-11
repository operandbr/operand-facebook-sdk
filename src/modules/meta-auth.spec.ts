import { CreateMetaAuth } from "../interfaces/meta-page";
import axios from "axios";
import { MetaAuth } from "./meta-auth";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Module MetaAuth", () => {
  describe("createAccessToken", () => {
    it("should make a request to /oauth/access_token and return the access token", async () => {
      const requestData: CreateMetaAuth = {
        client_id: "test-client-id",
        client_secret: "test-client-secret",
        redirect_uri: "https://example.com/callback",
        apiVersion: "v21.0",
        code: "test-code",
      };

      const mockAccessTokenResponse = {
        data: {
          access_token: "mocked-access-token",
        },
      };

      mockedAxios.create.mockReturnValue(mockedAxios);
      const mockPost = mockedAxios.post.mockResolvedValue(
        mockAccessTokenResponse,
      );

      const accessToken = await MetaAuth.createAccessToken(requestData);

      expect(accessToken).toBe("mocked-access-token");
      expect(mockedAxios.post).toHaveBeenCalledWith("/oauth/access_token", {
        client_id: requestData.client_id,
        client_secret: requestData.client_secret,
        code: requestData.code,
        redirect_uri: requestData.redirect_uri,
      });
      expect(mockPost).toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });
});
