import { generateAxiosInstance } from "../utils/api";
import * as FileType from "file-type";
import { MetaPage } from "./meta-page";
import { CreatePost } from "../interfaces/meta-page";

jest.mock("../utils/api");
jest.mock("node:fs");
jest.mock("file-type");

const pageAccessToken = "dummyAccessToken";
const pageId = "dummyPageId";
const apiVersion = "v21.0";
let metaPage: MetaPage;
const axiosMock = {
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};
(generateAxiosInstance as jest.Mock).mockReturnValue(axiosMock);

beforeEach(() => {
  jest.clearAllMocks();
  metaPage = new MetaPage({ pageAccessToken, pageId, apiVersion });
});

describe("MetaPage", () => {
  describe("createPost", () => {
    it("should create a text post when mediaType is none", async () => {
      const post = {
        message: "Test message",
        publishNow: true,
      } as CreatePost;
      const mockData = { data: { id: "12345" } };
      axiosMock.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      // expect(axiosMock.post).toHaveBeenCalledWith(`/${pageId}/feed`, {
      //   access_token: pageAccessToken,
      //   message: post.message,
      //   published: post.publishNow,
      // });
      expect(result).toBe("12345");
    });

    it("should throw an OperandError if scheduled publish date is invalid", async () => {
      const post = {
        message: "Test message",
        publishNow: false,
        datePublish: new Date(Date.now() - 600000),
      } as CreatePost;

      await expect(metaPage.createPost(post)).rejects.toThrow(
        "The datePublish must be between 10 minutes from now and 6 months from now.",
      );
    });
  });

  describe("deletePost", () => {
    it("should delete a post by id", async () => {
      const postId = "dummyPostId";
      const mockData = { data: { success: true } };
      axiosMock.delete.mockResolvedValueOnce(mockData);

      const result = await metaPage.deletePost(postId);

      expect(axiosMock.delete).toHaveBeenCalledWith(`/${postId}`, {
        params: { access_token: pageAccessToken },
      });
      expect(result).toBe(true);
    });
  });

  describe("uploadPhotos", () => {
    // it("should upload a photo by URL", async () => {
    //   const photoUrl = "http://example.com/photo.jpg";
    //   const mockPhotoId = "photo123";
    //   axiosMock.post.mockResolvedValueOnce({ data: { id: mockPhotoId } });
    //   const savePhotoInMetaStorageByUrlSpy = jest.spyOn(
    //     metaPage,
    //     "savePhotoInMetaStorageByUrl",
    //   );

    //   const result = await metaPage["uploadPhotos"]([
    //     { source: "url", value: photoUrl },
    //   ]);

    //   expect(savePhotoInMetaStorageByUrlSpy).toHaveBeenCalledWith(photoUrl);
    //   expect(result).toEqual([mockPhotoId]);
    // });

    it("should throw OperandError if photo file type is not permitted", async () => {
      const invalidPhotoPath = "path/to/photo.txt";
      (FileType.fromFile as jest.Mock).mockResolvedValueOnce({ ext: "txt" });

      await expect(
        metaPage["savePhotoInMetaStorageByPath"](invalidPhotoPath),
      ).rejects.toThrow(
        "This file type is not permitted. File types permitted: jpeg, bmp, png, gif, tiff.",
      );
    });
  });

  describe("updatePost", () => {
    it("should update a post by id", async () => {
      const postId = "dummyPostId";
      const message = "Updated message";
      const mockData = { data: { success: true } };
      axiosMock.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.updatePost(postId, message);

      expect(axiosMock.post).toHaveBeenCalledWith(`/${postId}`, {
        access_token: pageAccessToken,
        message,
      });
      expect(result).toBe(true);
    });
  });
});
