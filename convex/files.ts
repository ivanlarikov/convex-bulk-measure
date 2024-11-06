import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("files").collect();
  },
});

export const getTotalCount = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    return files.length;
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
      fileType: v.string(),
      fileSize: v.number()
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
        await ctx.storage.delete(doc.storageId);
      }
      await ctx.db.delete(doc._id);
    }
  },
});
