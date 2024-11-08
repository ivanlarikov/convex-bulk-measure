/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_fileActions from "../actions/fileActions.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as httpActions_uploadFileAction from "../httpActions/uploadFileAction.js";
import type * as httpActions_uploadMultiFilesAction from "../httpActions/uploadMultiFilesAction.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/fileActions": typeof actions_fileActions;
  files: typeof files;
  http: typeof http;
  "httpActions/uploadFileAction": typeof httpActions_uploadFileAction;
  "httpActions/uploadMultiFilesAction": typeof httpActions_uploadMultiFilesAction;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
