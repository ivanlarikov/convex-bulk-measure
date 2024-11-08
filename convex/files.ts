import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("files").collect();
  },
});

export const getOne = query({
  args: {
    id: v.id("files"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getSizedFiles = query({
  args: {},
  handler: async (ctx) => {
    const sizedFiles = await ctx.db
      .query("files")
      .filter((q) => {
        return q.gt(q.field("fileSize"), 0)
      })
      .collect();
    return sizedFiles;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const save = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
    });
  },
});

export const saveMulti = mutation({
  args: {
    data: v.array(v.object({
      storageId: v.optional(v.id("_storage")),
      fileName: v.string(),
      fileType: v.optional(v.string()),
      fileSize: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    const inserts = args.data.map(item => ctx.db.insert("files", item));
    return await Promise.all(inserts);
  },
});

export const updateStorageId = mutation({
  args: {
    storageId: v.id("_storage"),
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { storageId: args.storageId });
  },
});

export const removeAll = mutation({
  args: {  },
  handler: async (ctx, args) => {
    const documents = await ctx.db.query("files").collect();
    for (const doc of documents) {
      if (doc.storageId) {
        try {
          await ctx.storage.delete(doc.storageId);
        } catch (err) {
          
        }
      }
      await ctx.db.delete(doc._id);
    }
  },
});

export const updateRow = mutation({
  args: {
    id: v.id("files"),
    data: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.data);
  }
});

export const setJobStart = mutation({
  args: {
    jobName: v.string(),
    time: v.number(),
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      [args.jobName]: "Running",
      [args.jobName + "Start"]: args.time
    });
  },
});

export const setJobEnd = mutation({
  args: {
    jobName: v.string(),
    time: v.number(),
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.id, {
        [args.jobName]: "Done",
        [args.jobName + "End"]: args.time
      });
    } catch (err) {
      await ctx.db.patch(args.id, {
        [args.jobName]: "Failed",
        [args.jobName + "End"]: args.time
      });
    }
  },
});

export const getMetadata = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.system.get(args.storageId);
  },
});