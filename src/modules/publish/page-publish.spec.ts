import axios from "axios";
import { MetaPage } from "../meta-page";
import { CreatePost, CreateStories } from "../../interfaces/page-publish";
import * as path from "node:path";
import { PHOTO_URL_MOCK, VIDEO_URL_MOCK } from "../../__test__/mocks";

// const originalFetch = global.fetch;

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create.mockReturnValue(mockedAxios);

describe("MetaPage", () => {
  let metaPage: MetaPage;
  const pageAccessToken = "dummyAccessToken";
  const pageId = "dummyPageId";
  const apiVersion = "v21.0";

  beforeAll(() => {
    metaPage = new MetaPage({ pageAccessToken, pageId, apiVersion });
  });

  describe("createPost", () => {
    it("should create a text post without mediaType and without schedule", async () => {
      const post = {
        message: "Test message",
        publishNow: true,
      } as CreatePost;
      const mockData = { data: { id: "12345" } };
      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenCalledWith(`/dummyPageId/feed`, {
        access_token: "dummyAccessToken",
        message: "Test message",
      });
    });

    it("should create a text post without mediaType and with schedule", async () => {
      const datePublish = new Date(
        new Date().setDate(new Date().getDate() + 1),
      );

      const post = {
        message: "Test message",
        publishNow: false,
        datePublish,
      } as CreatePost;

      const mockData = { data: { id: "12345" } };
      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenCalledWith(`/dummyPageId/feed`, {
        access_token: "dummyAccessToken",
        message: "Test message",
        published: false,
        scheduled_publish_time: Math.floor(datePublish.getTime() / 1000),
      });
    }, 10000);

    it("should create a photo url post without schedule", async () => {
      const post = {
        message: "Test message",
        publishNow: true,
        mediaType: "photo",
        photos: [
          {
            source: "url",
            value: PHOTO_URL_MOCK,
          },
        ],
      } as CreatePost;

      const mockData = { data: { id: "12345" } };

      mockedAxios.post
        .mockResolvedValueOnce(mockData)
        .mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenLastCalledWith(`/dummyPageId/feed`, {
        access_token: "dummyAccessToken",
        message: "Test message",
        attached_media: [{ media_fbid: "12345" }],
      });
    }, 10000);

    it("should create a photo url post with schedule", async () => {
      const datePublish = new Date(
        new Date().setDate(new Date().getDate() + 1),
      );

      const post = {
        message: "Test message",
        publishNow: false,
        datePublish,
        mediaType: "photo",
        photos: [
          {
            source: "url",
            value: PHOTO_URL_MOCK,
          },
        ],
      } as CreatePost;

      const mockData = { data: { id: "12345" } };

      mockedAxios.post
        .mockResolvedValueOnce(mockData)
        .mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenLastCalledWith(`/dummyPageId/feed`, {
        access_token: "dummyAccessToken",
        message: "Test message",
        attached_media: [{ media_fbid: "12345" }],
        published: false,
        scheduled_publish_time: Math.floor(datePublish.getTime() / 1000),
      });
    }, 10000);

    it("should create a photo path post without schedule", async () => {
      const post = {
        message: "Test message",
        publishNow: true,
        photos: [
          {
            source: "path",
            value: path.resolve(
              __dirname,
              "..",
              "__test__",
              "mocks",
              "image.jpeg",
            ),
          },
        ],
      } as CreatePost;

      const mockData = { data: { id: "12345" } };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
    });

    it("should create a photo path post with schedule", async () => {
      const datePublish = new Date(
        new Date().setDate(new Date().getDate() + 1),
      );

      const post = {
        message: "Test message",
        publishNow: false,
        datePublish,
        photos: [
          {
            source: "path",
            value: path.resolve(
              __dirname,
              "..",
              "__test__",
              "mocks",
              "image.jpeg",
            ),
          },
        ],
      } as CreatePost;

      const mockData = { data: { id: "12345" } };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenCalledWith(`/dummyPageId/feed`, {
        access_token: "dummyAccessToken",
        message: "Test message",
        published: false,
        scheduled_publish_time: Math.floor(datePublish.getTime() / 1000),
      });
    });

    it("should create a video url post without schedule", async () => {
      const post = {
        message: "Test message",
        publishNow: true,
        mediaType: "video",
        video: {
          source: "url",
          value: VIDEO_URL_MOCK,
        },
      } as CreatePost;

      const mockData = { data: { id: "12345" } };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
    }, 10000);

    it("should create a video url post with schedule", async () => {
      const datePublish = new Date(
        new Date().setDate(new Date().getDate() + 1),
      );

      const post = {
        message: "Test message",
        publishNow: false,
        datePublish,
        mediaType: "video",
        video: {
          source: "url",
          value: VIDEO_URL_MOCK,
        },
      } as CreatePost;

      const mockData = { data: { id: "12345" } };

      mockedAxios.post.mockResolvedValueOnce(mockData);

      const result = await metaPage.createPost(post);

      expect(result).toBe("12345");
    }, 10000);

    it("should error if publishNow is false and datePublish not provided", async () => {
      const post = {
        message: "Test message",
        publishNow: false,
      } as CreatePost;

      await expect(metaPage.createPost(post)).rejects.toThrowError(
        "You must provide the datePublish if you don't want to publish now.",
      );
    });

    it("should error if publishNow is false and datePublish is bellow the current date", async () => {
      const post = {
        message: "Test message",
        publishNow: false,
        datePublish: new Date(new Date().setDate(new Date().getDate() - 1)),
      } as CreatePost;

      await expect(metaPage.createPost(post)).rejects.toThrowError(
        "The datePublish must be between 10 minutes from now and 6 months from now.",
      );
    });
  });

  describe("deletePost", () => {
    it("should delete a post", async () => {
      const postId = "12345";
      const mockData = { data: { success: true } };

      mockedAxios.delete.mockResolvedValueOnce(mockData);

      const result = await metaPage.deletePost(postId);

      expect(result).toBe(true);
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/12345`, {
        params: {
          access_token: "dummyAccessToken",
        },
      });
    });
  });

  describe("getAllPosts", () => {
    it("should get all posts", async () => {
      const mockData = { data: { data: [{ id: "12345" }] } };

      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await metaPage.getAllPosts();

      expect(result).toStrictEqual([{ id: "12345" }]);
      expect(mockedAxios.get).toHaveBeenCalledWith(`/dummyPageId/feed`, {
        params: {
          access_token: "dummyAccessToken",
        },
      });
    });
  });

  describe("createStories", () => {
    it("should create a story with image", async () => {
      const stories = {
        source: "url",
        mediaType: "photo",
        url: PHOTO_URL_MOCK,
      } as CreateStories;

      const mockData = { data: { id: "12345" } };
      const mockData2 = { data: { post_id: "12345" } };

      mockedAxios.post
        .mockResolvedValueOnce(mockData)
        .mockResolvedValueOnce(mockData2);

      const result = await metaPage.createStories(stories);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        `/dummyPageId/photo_stories`,
        {
          access_token: "dummyAccessToken",
          photo_id: "12345",
        },
      );
    }, 10000);

    it.skip("should create a story with video", async () => {
      const stories = {
        source: "url",
        mediaType: "video",
        url: VIDEO_URL_MOCK,
      } as CreateStories;

      const mockDataUpload = {
        data: { video_id: "12345", upload_url: "www.example.com" },
      };

      const mockData = { data: { post_id: "12345" } };

      const mockedFetch = jest.spyOn(global, "fetch");

      mockedFetch
        // .mockResolvedValueOnce((...args) => originalFetch(...args))
        .mockResolvedValueOnce(null);

      mockedAxios.post
        .mockResolvedValueOnce(mockDataUpload)
        .mockResolvedValueOnce(mockData);

      const result = await metaPage.createStories(stories);

      expect(result).toBe("12345");
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        `/dummyPageId/video_stories`,
        {
          access_token: "dummyAccessToken",
          video_id: "12345",
        },
      );
    }, 10000);

    it("should create a story with image from path", async () => {
      const stories = {
        source: "path",
        mediaType: "photo",
        path: path.resolve(__dirname, "..", "__test__", "mocks", "image.jpeg"),
      } as CreateStories;

      const mockDataUpload = {
        data: {
          id: "12345",
        },
      };
      const mockData = { data: { post_id: "12345" } };

      mockedAxios.post
        .mockResolvedValueOnce(mockDataUpload)
        .mockResolvedValueOnce(mockData);

      const result = await metaPage.createStories(stories);

      expect(result).toBe("12345");
    });
  });
});
