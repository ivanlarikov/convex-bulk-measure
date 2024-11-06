import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

const uploadFileAction = httpAction(async (ctx, request) => {
  // Step 1: Store the file
  const blob = await request.blob();
  const storageId = await ctx.storage.store(blob);

  // Step 2: Save the file info to the database via a mutation
  const params = new URL(request.url).searchParams;
  const fileName = <string>params.get("fileName");
  const fileType = <string>params.get("fileType");
  const fileSize = Number(params.get("fileSize"));
  await ctx.runMutation(api.files.save, { storageId, fileName, fileType, fileSize });

  // Step 3: Return a response with the correct CORS headers
  return new Response(null, {
    status: 200,
    // CORS headers
    headers: new Headers({
      // e.g. https://mywebsite.com, configured on your Convex dashboard
      // "Access-Control-Allow-Origin": CLIENT_ORIGIN,
      "Access-Control-Allow-Origin": "http://localhost:5173",
      Vary: "origin",
    }),
  });
});

export default uploadFileAction;