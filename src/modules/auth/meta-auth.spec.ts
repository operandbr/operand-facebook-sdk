import axios from "axios";
import { MetaAuth } from "./meta-auth";
import { ApiVersion, CreateMetaAuth } from "@/interfaces/meta-auth";

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

      const accessToken = await MetaAuth.createAccessTokenFb(requestData);

      expect(accessToken).toEqual({
        accessToken: "mocked-access-token",
        getAccounts: expect.any(Function),
      });

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

  describe("getAccounts", () => {
    it("should make a request to /me/accounts and return the accounts", async () => {
      const requestData = {
        fields: ["id", "name"],
        accessToken: "test-access-token",
        apiVersion: "v21.0" as ApiVersion,
      };

      const mockGetPageAccountsResponse = {
        data: {
          data: [
            {
              id: "test-page-id",
              name: "Test Page",
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue(mockedAxios);
      const mockGet = mockedAxios.get.mockResolvedValue(
        mockGetPageAccountsResponse,
      );

      const accounts = await MetaAuth.getAccountsWithFbToken(requestData);

      expect(accounts).toEqual([
        {
          id: "test-page-id",
          name: "Test Page",
        },
      ]);

      expect(mockedAxios.get).toHaveBeenCalledWith("/me/accounts", {
        params: {
          access_token: requestData.accessToken,
          fields: requestData.fields.join(","),
        },
      });

      expect(mockGet).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});
