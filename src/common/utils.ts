const VITE_CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

export const uploadFiles = (files: File[]) => {
  const uploadUrl = new URL(`${VITE_CONVEX_URL}/http/uploadFile`);

  files.forEach(async (file) => {
    uploadUrl.searchParams.set("fileName", file.name);
    uploadUrl.searchParams.set("fileType", file.type);
    uploadUrl.searchParams.set("fileSize", file.size);

    try {
      await fetch(uploadUrl, {
        method: "POST",
        body: file
      });
    } catch (err) {
      if (err.response) {
        console.log(err.response.status, err.response.data);
      }
    }
  });
}

export const uploadMultiFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files[]', file);
  });
  const uploadUrl = new URL(`${VITE_CONVEX_URL}/http/uploadMultiFiles`);

    // const file = files[0];
    // uploadUrl.searchParams.set("fileName", file.name);
    // uploadUrl.searchParams.set("fileType", file.type);
    // uploadUrl.searchParams.set("fileSize", file.size);
  return () => {
    return fetch(uploadUrl, {
      method: "POST",
      body: formData
    });
  };
}
