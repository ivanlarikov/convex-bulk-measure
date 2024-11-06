import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

import uploadFileAction from "./httpActions/uploadFileAction";
import uploadMultiFilesAction from "./httpActions/uploadMultiFilesAction";

const http = httpRouter();


const optionsAction = httpAction(async (_, request) => {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      }),
    });
  } else {
    return new Response();
  }
});

http.route({
  path: "/uploadFile",
  method: "POST",
  handler: uploadFileAction
});

// Pre-flight request for /uploadFile
http.route({
  path: "/uploadFile",
  method: "OPTIONS",
  handler: optionsAction,
});

http.route({
  path: "/uploadMultiFiles",
  method: "POST",
  handler: uploadMultiFilesAction
});

// Pre-flight request for /uploadMultiFiles
http.route({
  path: "/uploadMultiFiles",
  method: "OPTIONS",
  handler: optionsAction,
});


export default http;