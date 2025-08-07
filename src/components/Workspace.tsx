import React from "react";
import { useParams } from "react-router-dom";
import { FileExplorer } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { Terminal } from "./Terminal";
import { RatingSystem } from "./RatingSystem";
import { FeedbackButton } from "./FeedbackButton";
import { useFileSystem } from "../hooks/useFileSystem";
import { FileSystemItem } from "../types";

export const Workspace: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  if (!username) {
    return <div>Invalid workspace</div>;
  }

  const {
    rootFolder,
    setRootFolder,
    activeFile,
    setActiveFile,
    updateItem,
    addItem,
    deleteItem,
    replaceFileSystem, // Destructure replaceFileSystem
  } = useFileSystem(username);

  const handleFileSelect = (file: FileSystemItem) => {
    if (file.type === "file") {
      setActiveFile(file);
    }
  };

  const handleContentChange = (content: string) => {
    if (activeFile) {
      updateItem(activeFile.path, { content });
      setActiveFile({ ...activeFile, content });
    }
  };

  const handleCreateFile = (parentPath: string, name: string) => {
    const newFile: FileSystemItem = {
      id: `${parentPath}/${name}`,
      name,
      type: "file",
      content: "",
      path: `${parentPath}/${name}`,
    };
    addItem(parentPath, newFile);
  };

  const handleCreateFolder = (parentPath: string, name: string) => {
    const newFolder: FileSystemItem = {
      id: `${parentPath}/${name}`,
      name,
      type: "folder",
      children: [],
      path: `${parentPath}/${name}`,
    };
    addItem(parentPath, newFolder);
  };

  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      {/* Title Bar */}
      <div className="h-8 bg-[#3c3c3c] flex items-center px-4 border-b border-[#5a5a5a]">
        <div className="flex-1 text-center">
          <span className="text-sm text-[#cccccc]">
            Kit Playground - {username}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 h-full">
          <FileExplorer
            rootFolder={rootFolder}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteItem={deleteItem}
          />
        </div>

        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Code Editor */}
          <div className="flex-1">
            <CodeEditor
              activeFile={activeFile}
              onContentChange={handleContentChange}
            />
          </div>

          {/* Terminal */}
          <div className="h-64 border-t border-[#3c3c3c]">
            <Terminal
              username={username}
              rootFolder={rootFolder}
              onFolderUpdate={setRootFolder}
              onReplaceFileSystem={replaceFileSystem} // Pass replaceFileSystem to Terminal
            />
          </div>
        </div>
      </div>

      {/* Rating System */}
      <RatingSystem username={username} />
    </div>
  );
};
