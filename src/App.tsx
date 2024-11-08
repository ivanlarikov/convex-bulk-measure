import "./App.css";
import { FormEvent, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import moment from 'moment';
import { api } from "../convex/_generated/api";

const App = () => {

  const CHUNK_PROMISES_CNT = 16;

  const files = useQuery(api.files.get);
  const removeAllFiles = useMutation(api.files.removeAll);
  const saveMultiRecords = useMutation(api.files.saveMulti);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateStorageId = useAction(api.actions.fileActions.updateStorageId);
  const setJobStart = useAction(api.actions.fileActions.setJobStart);
  const setJobEnd = useAction(api.actions.fileActions.setJobEnd);


  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[] | null>(null);
  const [stage, setStage] = useState<string>('');
  const [uploadedFilesCnt, setUploadedFilesCnt] = useState<number>(0);
  const [elpasedSeconds, setElapsedSeconds] = useState<number>(0);

  // Define global variables
  const uploadStartedCnt = useRef<number>(0);
  const uploadFinishedCnt = useRef<number>(0);
  const timer = useRef<number>(0);
  const uploadingFiles = useRef<any[]>([]);

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

    await removeAll();

    startTimer();

    await addAll();

    setStage('upload');
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
    const sliced = uploadingFiles.current.slice(0, CHUNK_PROMISES_CNT);
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
      fileName: file.name
    }));
    try {
      const newIds = await saveMultiRecords({data: rows});
      uploadingFiles.current = selectedFiles.map((f, index) => {
        f.id = newIds[index];
        return f;
      });
    } catch (err) {
      console.error(err);
    }
  }

  const sendSingleFile = async (f: any) => {
    return new Promise(async (resolve, reject) => {
      uploadStartedCnt.current++;
      try {

        const { id, file } = f;

        await setJobStart({id, jobName: "upload"});
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        await setJobEnd({id, jobName: "upload"});

        const { storageId } = await result.json();
        await updateStorageId({ id, storageId });

        uploadFinishedCnt.current++;
        setUploadedFilesCnt(uploadFinishedCnt.current);
        onSingleFileUploaded(storageId);
        resolve(storageId);
      } catch (err) {
        uploadFinishedCnt.current++;
        reject(err);
      }
    });
  }

  const onSingleFileUploaded = (storageId: string) => {
    const uploadingFilesCnt = uploadingFiles.current.length;
    if (uploadFinishedCnt.current === uploadingFilesCnt) {
      onAllFilesUploaded();
    } else {
      const uploadingCnt = uploadStartedCnt.current - uploadFinishedCnt.current;
      const newReqCnt = CHUNK_PROMISES_CNT - Math.abs(uploadingCnt);
      const sliced = uploadingFiles.current.slice(uploadStartedCnt.current, uploadStartedCnt.current + newReqCnt);
      sliced.forEach(f => sendSingleFile(f));
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

  const formatTime = (time) => {
    if (!time) {
      return time;
    }
    const ms = ((time % 1000) / 1000).toFixed(3);
    return moment(time).format('HH:mm:ss') + ms.substring(1); 
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
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th rowSpan={2} width="50px">No</th>
                <th rowSpan={2} width="140px">Created</th>
                <th rowSpan={2}>FileName</th>
                <th colSpan={3}>Upload and SaveToStorage</th>
                <th colSpan={3}>UpdateStorageId</th>
                <th colSpan={3}>GetFileType</th>
                <th colSpan={3}>GetFileSize</th>
                <th rowSpan={2} width="80px">FileSize<br/>(bytes)</th>
                <th colSpan={3}>GetTotalSize</th>
                <th rowSpan={2} width="80px">TotalSize<br/>(bytes)</th>
              </tr>
              <tr>
                <th width="100px">Start</th>
                <th width="100px">End</th>
                <th width="60px">Status</th>
                <th width="100px">Start</th>
                <th width="100px">End</th>
                <th width="60px">Status</th>
                <th width="100px">Start</th>
                <th width="100px">End</th>
                <th width="60px">Status</th>
                <th width="100px">Start</th>
                <th width="100px">End</th>
                <th width="60px">Status</th>
                <th width="100px">Start</th>
                <th width="100px">End</th>
                <th width="60px">Status</th>
              </tr>
            </thead>
            <tbody>
              {files?.map((row, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatTime(row._creationTime)}</td>
                  <td>{row.fileName}</td>
                  <td>{formatTime(row.uploadStart)}</td>
                  <td>{formatTime(row.uploadEnd)}</td>
                  <td>{row.upload || 'Waiting'}</td>
                  <td>{formatTime(row.updateStorageIdStart)}</td>
                  <td>{formatTime(row.updateStorageIdEnd)}</td>
                  <td>{row.updateStorageId || 'Waiting'}</td>
                  <td>{formatTime(row.getFileTypeStart)}</td>
                  <td>{formatTime(row.getFileTypeEnd)}</td>
                  <td>{row.getFileType || 'Waiting'}</td>
                  <td>{formatTime(row.getFileSizeStart)}</td>
                  <td>{formatTime(row.getFileSizeEnd)}</td>
                  <td>{row.getFileSize || 'Waiting'}</td>
                  <td>{row.fileSize}</td>
                  <td>{formatTime(row.getTotalSizeStart)}</td>
                  <td>{formatTime(row.getTotalSizeEnd)}</td>
                  <td>{row.getTotalSize || 'Waiting'}</td>
                  <td>{row.totalSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/*<ul>
          {
            files?.map(({ _id, storageId, fileName, fileType, fileSize }, index) => (
              <li key={_id}>
                {index + 1}. {fileName} - {fileType} - {Math.round(fileSize/1024)}KB
                {storageId && <svg width="64px" height="64px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#17de3f" fillRule="evenodd" d="M3 10a7 7 0 019.307-6.611 1 1 0 00.658-1.889 9 9 0 105.98 7.501 1 1 0 00-1.988.22A7 7 0 113 10zm14.75-5.338a1 1 0 00-1.5-1.324l-6.435 7.28-3.183-2.593a1 1 0 00-1.264 1.55l3.929 3.2a1 1 0 001.38-.113l7.072-8z"></path> </g></svg>}
              </li>
            ))
          }
        </ul>*/}
      </div>
    </>
  );
}

export default App;