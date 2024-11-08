import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    fileName: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    totalSize: v.optional(v.number()),

    upload: v.optional(v.string()),
    uploadStart: v.optional(v.number()),
    uploadEnd: v.optional(v.number()),

    toStorage: v.optional(v.number()),
    toStorageStart: v.optional(v.number()),
    toStorageEnd: v.optional(v.number()),

    updateStorageId: v.optional(v.string()),
    updateStorageIdStart: v.optional(v.number()),
    updateStorageIdEnd: v.optional(v.number()),

    getFileType: v.optional(v.string()),
    getFileTypeStart: v.optional(v.number()),
    getFileTypeEnd: v.optional(v.number()),

    getFileSize: v.optional(v.string()),
    getFileSizeStart: v.optional(v.number()),
    getFileSizeEnd: v.optional(v.number()),

    getTotalSize: v.optional(v.string()),
    getTotalSizeStart: v.optional(v.number()),
    getTotalSizeEnd: v.optional(v.number()),
  }),
});