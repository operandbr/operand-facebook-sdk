# Welcome to the best SDK for communicating with api's meta

## Get Started

### First, install lib:
```sh
  npm install operand-facebook-sdk@1.0.0
```
### Next, import with ES6 or CommonJS:

- ES6
```javascript
import { MetaPage } from 'easy-facebook-sdk';

(async () => {
	const page = new MetaPage({
		apiVersion: 'v21.0',
		pageId: 'your-page-id',
		pageAccessToken: 'your-page-access-token',
	})

	const pageData = await page.getAllPosts()

	console.log({ pageData });
})()
```
- CommonJS
```javascript
const OPSDK = require("operand-facebook-sdk");

(async () => {
	const page = new OPSDK.MetaPage({
		apiVersion: 'v21.0',
		pageId: 'your-page-id',
		pageAccessToken: 'your-page-access-token',
	})

	const pageData = await page.getAllPosts()

	console.log({ pageData });
})()
```

## Documentation

### Classes

#### `MetaAuth`

Provides authentication for generating access tokens for the Meta API.

#### Methods

- `createAccessToken(options: CreateMetaAuth): Promise<string>`
  - **Description**: Generates an access token for accessing Meta API resources.
  - **Parameters**:
    - `client_id`: The application’s client ID.
    - `client_secret`: The application’s client secret.
    - `redirect_uri`: Redirect URI after the user grants permissions.
    - `apiVersion`: API version to use.
    - `code`: The authorization code from the OAuth process.
  - **Returns**: A `Promise` that resolves with the access token as a `string`.

---

#### `MetaPage`

Handles operations for managing Meta pages, including posting, updating, and deleting posts, as well as creating stories.

##### Constructor

- **Parameters**:
  - `pageAccessToken`: Access token for the page.
  - `pageId`: ID of the page to manage.
  - `apiVersion`: Version of the API to use.

##### Methods

- `getAccounts(options: GetAccounts): Promise<any>`
  - **Description**: Retrieves accounts associated with the page.
  - **Parameters**:
    - `fields`: Array of fields to include in the response.
  - **Returns**: An `Array` of account objects.

- `getAllPosts(): Promise<PagePost[]>`
  - **Description**: Fetches all posts on the page.
  - **Returns**: A list of `PagePost` objects.

- `getPostUrlById(postId: string): string`
  - **Description**: Generates a URL for a post by its ID.
  - **Parameters**:
    - `postId`: ID of the post.
  - **Returns**: The URL of the post.

- `createPost(post: CreatePost): Promise<string>`
  - **Description**: Creates a post on the page, either text, photo, or video.
  - **Parameters**:
    - `post`: Post configuration object, including message, publication time, and media type.
  - **Returns**: The ID of the created post.

- `updatePost(postId: string, message: string): Promise<boolean>`
  - **Description**: Updates the content of a post.
  - **Parameters**:
    - `postId`: ID of the post to update.
    - `message`: New content for the post.
  - **Returns**: Boolean indicating success.

- `deletePost(postId: string): Promise<boolean>`
  - **Description**: Deletes a post by ID.
  - **Parameters**:
    - `postId`: ID of the post to delete.
  - **Returns**: Boolean indicating success.

- `createStories(story: CreateStories): Promise<string>`
  - **Description**: Creates a story for the page, either photo or video.
  - **Parameters**:
    - `story`: Story configuration including media type and source.
  - **Returns**: The ID of the created story.

##### Private Methods

- `fileTypesPermitted(file: "video" | "photo", type: string): boolean`
  - **Description**: Checks if the file type is permitted.

- `verifyPhotoSize(value: string | Buffer, isBuffer: boolean): Promise<boolean>`
  - **Description**: Checks if the photo size is within allowed limits.

- `validatePublishDate(datePublish: Date): boolean`
  - **Description**: Validates that the publish date is within 10 minutes to 6 months from now.

- `savePhotoInMetaStorageByUrl(url: string): Promise<string>`
  - **Description**: Saves a photo in Meta’s storage using a URL.

- `savePhotoInMetaStorageByPath(path: string): Promise<string>`
  - **Description**: Saves a photo in Meta’s storage using a file path.

- `saveVideoInMetaStorageMomentaryByUrl(video: string): Promise<string>`
  - **Description**: Saves a video momentarily in Meta’s storage by URL.

- `uploadPhotos(photos: Array<{ source: string; value: string }>): Promise<string[]>`
  - **Description**: Uploads multiple photos to Meta’s storage.

- `createTextPost(message: string, publishNow: boolean, datePublish?: Date): Promise<string>`
  - **Description**: Creates a text-only post on the page.

- `createMediaPost(message: string, mediaIds: string[], publishNow: boolean, datePublish?: Date): Promise<string>`
  - **Description**: Creates a media post on the page with specified media IDs.

- `uploadVideo(video: { source: string; value: string }, message: string, publishNow: boolean, datePublish?: Date): Promise<string>`
  - **Description**: Uploads a video to Meta’s storage, supporting both immediate and scheduled publishing.

- `createPhotoStory(story: CreateStories): Promise<string>`
  - **Description**: Creates a photo story on the page.

- `createVideoStory(story: CreateStories): Promise<string>`
  - **Description**: Creates a video story on the page.

---

### Interfaces

#### `Meta`

```typescript
export interface PagePost {
  created_time: string;
  message: string;
  id: string;
}

export interface PaginationCursors {
  before: string;
  after: string;
}

export interface PaginationInfo {
  cursors: PaginationCursors;
}

export interface GetPagePostsResponse {
  data: PagePost[];
  paging: PaginationInfo;
}

export interface CreatePagePostResponse {
  id: string;
  post_id?: string;
}

export interface UpdatePagePostResponse {
  success: boolean;
}

export interface DeletePagePostResponse {
  success: boolean;
}

export interface SaveMediaStorageResponse {
  id: string;
}

export interface CreatePhotoStoriesResponse {
  success: boolean;
  post_id: string;
}

export interface CreateAccessTokenResponse {
  access_token: string;
  token_type: string;
}

export interface GetPageAccountsResponse {
  data: Array<{
    id: string;
    name?: string;
    about?: string;
    category?: string;
    category_list?: Array<{ id: string; name: string }>;
    location?: {
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      street?: string;
      zip?: string;
    };
    fan_count?: number;
    access_token?: string;
    tasks?: string[];
    picture?: {
      data: {
        url: string;
        width?: number;
        height?: number;
        is_silhouette?: boolean;
      };
    };
    cover?: {
      id: string;
      source: string;
      offset_y?: number;
      offset_x?: number;
    };
    photos?: {
      data: Array<{
        id: string;
        name?: string;
        created_time?: string;
        picture?: string;
      }>;
    };
    videos?: {
      data: Array<{
        id: string;
        title?: string;
        description?: string;
        picture?: string;
        source?: string;
      }>;
    };
    engagement?: {
      count?: number;
      social_sentence?: string;
    };
    is_published?: boolean;
    is_verified?: boolean;
    verification_status?: string;
    website?: string;
    emails?: string[];
    phone?: string;
    instagram_business_account?: { id: string };
    hours?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
    };
    created_time?: string;
    bio?: string;
    link?: string;
    business?: {
      id: string;
      name: string;
    };
  }>;
}

export interface CreateStartVideoUploadResponse {
  video_id: string;
  upload_url: string;
}

export interface CreateLoadingVideoUploadResponse {
  success: boolean;
}

export interface CreateFinishVideoUploadResponse {
  success: boolean;
  message: string;
  post_id: string;
}

```

#### `Main`

```typescript
import { PagePost } from "./meta";

export type ApiVersion = "v17.0" | "v18.0" | "v19.0" | "v20.0" | "v21.0";

export type ConstructorMain = {
  pageId: string;
  pageAccessToken: string;
  apiVersion: ApiVersion;
};

export type CreateMetaAuth = {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  apiVersion: ApiVersion;
  code: string;
};

export type GetAccounts = {
  fields: Array<
    | "id"
    | "name"
    | "about"
    | "category"
    | "category_list"
    | "location"
    | "fan_count"
    | "access_token"
    | "tasks"
    | "picture"
    | "cover"
    | "photos"
    | "videos"
    | "engagement"
    | "is_published"
    | "is_verified"
    | "verification_status"
    | "website"
    | "emails"
    | "phone"
    | "instagram_business_account"
    | "hours"
    | "created_time"
    | "bio"
    | "link"
    | "business"
  >;
};

type PhotoMediaItem = {
  source: "url" | "path";
  value: string;
};

type VideoMediaItem = {
  source: "url" | "path";
  value: string;
};

type CreatePostWithPhotos = {
  mediaType: "photo";
  photos: PhotoMediaItem[];
  message?: string;
  publishNow: boolean;
  datePublish?: Date;
};

type CreatePostWithVideos = {
  mediaType: "video";
  video: VideoMediaItem;
  message?: string;
  publishNow: boolean;
  datePublish?: Date;
};

type CreatePostWithoutMedia = {
  mediaType?: "none";
  message: string;
  publishNow: boolean;
  datePublish?: Date;
};

export type CreatePost =
  | CreatePostWithVideos
  | CreatePostWithPhotos
  | CreatePostWithoutMedia;

type CreateStoriesPath = {
  mediaSource: "local";
  mediaType: "photo" | "video";
  path: string;
};

type CreateStoriesUrl = {
  mediaSource: "url";
  mediaType: "photo" | "video";
  url: string;
};

export type CreateStories = CreateStoriesPath | CreateStoriesUrl;

export interface IMetaPage {
  getAllPosts(): Promise<PagePost[]>;
  getPostUrlById(postId: string): string;
  createPost(data: CreatePost): Promise<string>;
  updatePost(postId: string, message: string): Promise<boolean>;
  deletePost(postId: string): Promise<boolean>;
  createStories(data: CreateStories): Promise<string>;
  getAccounts(data: GetAccounts): Promise<GetAccounts>;
}

```


