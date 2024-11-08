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

// export const updateStorageId = action({
//   args: {
//     storageId: v.id("_storage"),
//     id: v.id("files")
//   },
//   handler: async (ctx, args) => {
//     await ctx.runAction(api.actions.fileActions.setJobStart, { id: args.id, jobName: "updateStorageId" });
//     await ctx.runMutation(api.files.updateRow, { id: args.id, data: {storageId: args.storageId} });
//     await ctx.runAction(api.actions.fileActions.setJobEnd, { id: args.id, jobName: "updateStorageId" });
//   },
// });

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
