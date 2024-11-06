import { MultipartParseError, parseMultipartRequest } from '@mjackson/multipart-parser';

import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

const _streamToBlob = async(readableStream: ReadableStream<Uint8Array>, mimeType: string) => {
  const chunks = []; // Array to hold Uint8Array chunks
  const reader = readableStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;  // Exit loop when stream ends
    chunks.push(value); // Push each Uint8Array chunk to the array
  }
  return new Blob(chunks, { type: mimeType });
}

const uploadMultiFilesAction = httpAction(async (ctx, request) => {

  for await (let part of parseMultipartRequest(request)) {
    const fileType = <string>part.mediaType;
    const fileName = <string>part.filename;
    const blob = await _streamToBlob(part.body, fileType);
    const storageId = await ctx.storage.store(blob);
    const fileSize = blob.size;
    
    await ctx.runMutation(api.files.save, { storageId, fileName, fileType, fileSize });
  }
  // const formData = await request.formData();
  // const uploadedFiles = formData.getAll('files[]');
  // for (let entry of <File[]>uploadedFiles) {
  //   const fileType = entry.type;
  //   const fileName = entry.name;
  //   const fileSize = entry.size;
  //   const storageId = await ctx.storage.store(new Blob([entry], {type: entry.type}));
  //   await ctx.runMutation(api.files.save, { storageId, fileName, fileType, fileSize });
  // }
  
  // Step 3: Return a response with the correct CORS headers
  return new Response(null, {
    status: 200,
    // CORS headers
    headers: new Headers({
      "Access-Control-Allow-Origin": "*",
      Vary: "origin",
    }),
  });
  return new Response();
});

export default uploadMultiFilesAction;