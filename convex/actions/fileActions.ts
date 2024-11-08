"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";


export const doSomething = action({
  handler: () => {
    // implementation goes here

    // optionally return a value
    return "success";
  },
});

export const updateStorageId = action({
  args: {
    storageId: v.id("_storage"),
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    const { setJobStart, setJobEnd, setFileType, setFileSize, setAllTotalSizes } = api.actions.fileActions;
    await ctx.runAction(setJobStart, { id: args.id, jobName: "updateStorageId" });
    await ctx.runMutation(api.files.updateRow, { id: args.id, data: {storageId: args.storageId} });
    await ctx.runAction(setJobEnd, { id: args.id, jobName: "updateStorageId" });

    // Get and save fileType
    await ctx.runAction(setFileType, {id: args.id});

    // Get and save fileSize
    await ctx.runAction(setFileSize, {id: args.id});

    // Get and save totalSize field of uploaded files
    await ctx.runAction(setAllTotalSizes);
  },
});

// Fill fileType field of each row
export const setFileType = action({
  args: {
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    const file = await ctx.runQuery(api.files.getOne, {id: args.id});
    if (!file || !file.storageId) {
      return;
    }
    const metadata = await ctx.runQuery(api.files.getMetadata, {storageId: file.storageId});
    if (!metadata) {
      return;
    }
    const { setJobStart, setJobEnd } = api.actions.fileActions;
    await ctx.runAction(setJobStart, { id: args.id, jobName: "getFileType" });
    await ctx.runMutation(api.files.updateRow, { id: args.id, data: {fileType: metadata.contentType} });
    await ctx.runAction(setJobEnd, { id: args.id, jobName: "getFileType" });
  },
});

// Fill fileSize field of each row
export const setFileSize = action({
  args: {
    id: v.id("files")
  },
  handler: async (ctx, args) => {
    const file = await ctx.runQuery(api.files.getOne, {id: args.id});
    if (!file || !file.storageId) {
      return;
    }
    const metadata = await ctx.runQuery(api.files.getMetadata, {storageId: file.storageId});
    if (!metadata) {
      return;
    }
    const { setJobStart, setJobEnd } = api.actions.fileActions;

    await ctx.runAction(setJobStart, { id: args.id, jobName: "getFileSize" });
    await ctx.runMutation(api.files.updateRow, { id: args.id, data: {fileSize: metadata.size} });
    await ctx.runAction(setJobEnd, { id: args.id, jobName: "getFileSize" });
  },
});


// Fill totalSize fields of all uploaded rows
export const setAllTotalSizes = action({
  args: {
  },
  handler: async (ctx, args) => {
    const { setJobStart, setJobEnd } = api.actions.fileActions;

    const sizedFiles = await ctx.runQuery(api.files.getSizedFiles);
    const totalSize = sizedFiles.reduce((prev, file) => prev + (file.fileSize || 0), 0);

    // Get and save totalSize field of for each file
    // sizedFiles.forEach(async (file) => {
    //   await ctx.runAction(setJobStart, { id: file._id, jobName: "getTotalSize" });
    //   await ctx.runMutation(api.files.updateRow, { id: file._id, data: {totalSize} });
    //   await ctx.runAction(setJobEnd, { id: file._id, jobName: "getTotalSize" });
    // });
    await Promise.all(sizedFiles.map(async (file) => {
      await ctx.runAction(setJobStart, { id: file._id, jobName: "getTotalSize" });
      await ctx.runMutation(api.files.updateRow, { id: file._id, data: {totalSize} });
      await ctx.runAction(setJobEnd, { id: file._id, jobName: "getTotalSize" });
    }));
  },
});


export const setJobStart = action({
  args: {
    id: v.id("files"),
    jobName: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.files.setJobStart, {
      id: args.id,
      jobName: args.jobName,
      time: getHrTime()
    });
  },
});


export const setJobEnd = action({
  args: {
    id: v.id("files"),
    jobName: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.files.setJobEnd, {
      id: args.id,
      jobName: args.jobName,
      time: getHrTime()
    });
  },
});

const getHrTime = () => {
  // const hrTime = process.hrtime();
  // return hrTime[0] * 1000 + hrTime[1] / 1000000;
  return Date.now();
};
