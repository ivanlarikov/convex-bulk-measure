import "./App.css";
import { FormEvent, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const App = () => {

  const CHUNK_PROMISES_CNT = 16;

  const files = useQuery(api.files.get);
  const removeAllFiles = useMutation(api.files.removeAll)
  const updateStorageId = useMutation(api.files.updateStorageId)
  const saveMultiRecords = useMutation(api.files.saveMulti)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);


  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[] | null>(null);
  const [stage, setStage] = useState<string>('');
  const [requestsCnt, setRequestsCnt] = useState<number>(0);
  const [uploadedFilesCnt, setUploadedFilesCnt] = useState<number>(0);
  const [elpasedSeconds, setElapsedSeconds] = useState<number>(0);

  // Define global variables
  const uploadStartedCnt = useRef<number>(0);
  const uploadFinishedCnt = useRef<number>(0);
  const timer = useRef<number>(0);
  
  const onSelectFiles = (event: any) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const filesArray = Array.from(target.files);
      setSelectedFiles(filesArray.map(
        f => ({file: f, id: ''})
      ));
    }
  }

  const startTimer = () => {
    setElapsedSeconds(0);
    timer.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  }

  const stopTimer = () => {
    clearInterval(timer.current);
  }

  const formatDisplayTime = (seconds: number) => {
    if (seconds < 60) {
      return seconds + ' secs';
    }
    return Number((seconds / 60).toFixed(2)) + ' mins';
  }

  const startUpload = async (event: FormEvent) => {
    event.preventDefault();
    console.log('selectedFiles:', selectedFiles);
    if (selectedFiles === null) {
      return;
    }

    removeAll();

    startTimer();

    addAll();

    setStage('upload');
    setRequestsCnt(0);
    setUploadedFilesCnt(0);
    uploadStartedCnt.current = 0;
    uploadFinishedCnt.current = 0;
    
    // Split all requests to chunk promises
    // const remainingFiles = [...selectedFiles];
    // Split promises
    // while (remainingFiles.length > 0) {
    //   const spliced = remainingFiles.splice(0, CHUNK_PROMISES_CNT);
    //   setRequestsCnt(prev => prev + spliced.length);
    //   console.log(spliced);
    //   await Promise.all(spliced.map(f => sendSingleFile(f)));
    // }
    const sliced = selectedFiles.slice(0, CHUNK_PROMISES_CNT);
    setRequestsCnt(prev => prev + sliced.length);
    sliced.forEach(f => sendSingleFile(f));
  }

  const removeAll = async () => {
    setStage('removeAll');
    // Remove all existing files
    try {
      await removeAllFiles();
    } catch (err) {
      console.error(err);
    }
  }

  const addAll = async () => {
    if (selectedFiles === null) {
      return;
    }
    setStage('addAll');
    // Add new records into table
    const rows = selectedFiles.map(({ file }) => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    }));
    try {
      const newIds = await saveMultiRecords({data: rows});
      const newSelectedFiles = selectedFiles.map((f, index) => {
        f.id = newIds[index];
        return f;
      });
      setSelectedFiles(newSelectedFiles);
    } catch (err) {
      console.error(err);
    }
  }

  const sendSingleFile = async (f: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        uploadStartedCnt.current++;
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": f.file.type },
          body: f.file,
        });
        const { storageId } = await result.json();
        await updateStorageId({ storageId, id: f.id });
        setUploadedFilesCnt(prev => prev + 1);
        uploadFinishedCnt.current++;
        onSingleFileUploaded(storageId);
        resolve(storageId);
      } catch (err) {
        reject(err);
      }
    });
  }

  const onSingleFileUploaded = (storageId: string) => {
    if (selectedFiles === null) {
      return;
    }
    console.log(uploadStartedCnt.current, uploadFinishedCnt.current, selectedFiles.length)
    if (uploadFinishedCnt.current === selectedFiles.length) {
      onAllFilesUploaded();
    } else {
      if (uploadStartedCnt.current < selectedFiles.length) {
        sendSingleFile(selectedFiles[uploadStartedCnt.current]);
      }
    }
  }

  const onAllFilesUploaded = () => {
    setSelectedFiles(null);
    setStage('');
    stopTimer();

    imageInput.current!.value = "";
  }

  const clickRemoveAll = async () => {
    await removeAll();
    setStage('');
    setUploadedFilesCnt(0);
  }

  const requestsInProgress = uploadStartedCnt.current - uploadFinishedCnt.current;

  return (
    <>
      <form onSubmit={startUpload}>
        <input
          type="file"
          multiple={true}
          ref={imageInput}
          onChange={onSelectFiles}
          disabled={selectedFiles !== null}
        />
        <input
          type="submit"
          value="Upload Files"
          disabled={selectedFiles === null || stage !== ''}
        />
        <input 
          type="button" 
          value="Remove All"
          disabled={files?.length === 0 || stage !== ''}
          onClick={clickRemoveAll}
        />
      </form>
      <div className="list">
        {stage === 'addAll' && <div>Adding all records...</div>}
        {stage === 'removeAll' && <div>Removing all...</div>}

        {(stage === 'upload' || uploadedFilesCnt > 0) && (
          <div className={`counts ${(uploadedFilesCnt === files?.length ? 'finished': '')}`}>
            Uploaded {uploadedFilesCnt} of {files?.length} &nbsp;&nbsp;&nbsp;&nbsp;
            Requests in Progress: {requestsInProgress} &nbsp;&nbsp;&nbsp;&nbsp;
            Elapsed Time: {formatDisplayTime(elpasedSeconds)}
          </div>
        )}
        
        <h1>Total files: {files?.length}</h1>
        <ul>
          {
            files?.map(({ _id, storageId, fileName, fileType, fileSize }, index) => (
              <li key={_id}>
                {index + 1}. {fileName} - {fileType} - {Math.round(fileSize/1024)}KB
                {storageId && <svg width="64px" height="64px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#17de3f" fillRule="evenodd" d="M3 10a7 7 0 019.307-6.611 1 1 0 00.658-1.889 9 9 0 105.98 7.501 1 1 0 00-1.988.22A7 7 0 113 10zm14.75-5.338a1 1 0 00-1.5-1.324l-6.435 7.28-3.183-2.593a1 1 0 00-1.264 1.55l3.929 3.2a1 1 0 001.38-.113l7.072-8z"></path> </g></svg>}
              </li>
            ))
          }
        </ul>
      </div>
    </>
  );
}

export default App;