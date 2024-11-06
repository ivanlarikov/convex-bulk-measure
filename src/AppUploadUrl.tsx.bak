import "./App.css";
import { FormEvent, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const convexSiteUrl = import.meta.env.VITE_CONVEX_URL;

const App = () => {

  const CHUNK_PROMISES_CNT = 16;

  const totalFilesCount = useQuery(api.files.getTotalCount);
  const files = useQuery(api.files.get);
  const removeAllFiles = useMutation(api.files.removeAll)
  const saveFile = useMutation(api.files.save)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);


  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRemovingAll, setIsRemovingAll] = useState<boolean>(false);
  const [selectedFilesCnt, setSelectedFilesCnt] = useState<number>(0);
  const [requestsCnt, setRequestsCnt] = useState<number>(0);

  const onSelectFiles = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  }

  const startUpload = async (event: FormEvent) => {
    event.preventDefault();
    console.log('selectedFiles:', selectedFiles);

    setIsUploading(true);
    setSelectedFilesCnt(selectedFiles.length);
    setRequestsCnt(0);
    
    setIsRemovingAll(true);
    // Remove all existing files
    try {
      await removeAllFiles();
    } catch (err) {

    }
    setIsRemovingAll(false);

    // Split all requests to chunk promises
    let startIndex = 0;
    const allCnt = selectedFiles.length;
    const remainingFiles = [...selectedFiles];
    // Split promises
    while (remainingFiles.length > 0) {
      const spliced = remainingFiles.splice(0, CHUNK_PROMISES_CNT);
      setRequestsCnt(requestsCnt + spliced.length);
      console.log(spliced);
      await Promise.all(spliced.map(file => sendSingleFile(file)));
    }
    
    setSelectedFiles(null);
    setIsUploading(false);

    imageInput.current!.value = "";
  }

  const sendSingleFile = async (file) => {
    return new Promise(async (resolve, reject) => {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await saveFile({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      resolve();
    });
  }

  return (
    <>
      <form onSubmit={startUpload}>
        <input
          type="file"
          multiple="multiple"
          ref={imageInput}
          onChange={onSelectFiles}
          disabled={selectedFiles !== null}
        />
        <input
          type="submit"
          value="Upload Files"
          disabled={selectedFiles === null || isUploading}
        />
      </form>
      <div className="list">
        {isRemovingAll && <div>Removing all...</div>}

        {(!isRemovingAll && isUploading) && <div className="counts">
          Added {totalFilesCount} of {selectedFilesCnt} &nbsp;&nbsp;&nbsp;&nbsp;
          Requests Sent: {requestsCnt}
        </div>}
        
        <h1>Uploaded Result ({totalFilesCount} files)</h1>
        <ul>
          {
            files?.map(({ _id, fileName, fileType, fileSize }, index) => (
              <li key={_id}>{index + 1}. {fileName} - {fileType} - {Math.round(fileSize/1024)}KB</li>
            ))
          }
        </ul>
      </div>
    </>
  );
}

export default App;