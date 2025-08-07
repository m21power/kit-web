import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { FileSystemItem } from "../types";

interface FileExplorerProps {
  rootFolder: FileSystemItem;
  activeFile: FileSystemItem | null;
  onFileSelect: (file: FileSystemItem) => void;
  onCreateFile: (parentPath: string, name: string) => void;
  onCreateFolder: (parentPath: string, name: string) => void;
  onDeleteItem: (path: string) => void; // <-- add prop
}

interface FileTreeItemProps {
  item: FileSystemItem;
  level: number;
  activeFile: FileSystemItem | null;
  onFileSelect: (file: FileSystemItem) => void;
  onCreateFile: (parentPath: string, name: string) => void;
  onCreateFolder: (parentPath: string, name: string) => void;
  onDeleteItem: (path: string) => void; // <-- add prop
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  level,
  activeFile,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteItem, // <-- add prop
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0 ? true : false);
  const [showActions, setShowActions] = useState(false);
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");

  const handleToggle = () => {
    if (item.type === "folder") {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(item);
    }
  };

  const handleCreateItem = (type: "file" | "folder") => {
    setIsCreating(type);
    setNewItemName("");
    setIsExpanded(true);
  };

  const handleSubmitCreate = () => {
    if (newItemName.trim()) {
      if (isCreating === "file") {
        onCreateFile(item.path, newItemName.trim());
      } else {
        onCreateFolder(item.path, newItemName.trim());
      }
    }
    setIsCreating(null);
    setNewItemName("");
  };

  const handleCancelCreate = () => {
    setIsCreating(null);
    setNewItemName("");
  };

  const isActive = activeFile?.path === item.path;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-[#2a2d2e] group ${
          isActive ? "bg-[#37373d] text-[#ffffff]" : "text-[#cccccc]"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleToggle}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {item.type === "folder" && (
          <div className="w-4 h-4 mr-1 flex items-center justify-center flex-shrink-0">
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              ))}
          </div>
        )}

        {item.type === "file" && (
          <div className="w-4 h-4 mr-1 flex-shrink-0"></div>
        )}

        <div className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
          {item.type === "folder" ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#dcb67a]" />
            ) : (
              <Folder className="w-4 h-4 text-[#dcb67a]" />
            )
          ) : (
            <File className="w-4 h-4 text-[#519aba]" />
          )}
        </div>

        <span className="flex-1 truncate">{item.name}</span>

        {/* Actions for folder */}
        {item.type === "folder" && showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateItem("file");
              }}
              className="p-1 hover:bg-[#3c3c3c] rounded"
              title="New File"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateItem("folder");
              }}
              className="p-1 hover:bg-[#3c3c3c] rounded"
              title="New Folder"
            >
              <Folder className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem && onDeleteItem(item.path);
              }}
              className="p-1 hover:bg-red-700 rounded"
              title="Delete Folder"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Actions for file */}
        {item.type === "file" && showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem && onDeleteItem(item.path);
              }}
              className="p-1 hover:bg-red-700 rounded"
              title="Delete File"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {item.type === "folder" && isExpanded && (
        <div>
          {isCreating && (
            <div
              className="flex items-center px-2 py-1 text-sm"
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
            >
              <div className="w-4 h-4 mr-1"></div>
              <div className="w-4 h-4 mr-2 flex items-center justify-center">
                {isCreating === "folder" ? (
                  <Folder className="w-4 h-4 text-[#dcb67a]" />
                ) : (
                  <File className="w-4 h-4 text-[#519aba]" />
                )}
              </div>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitCreate();
                  if (e.key === "Escape") handleCancelCreate();
                }}
                onBlur={handleSubmitCreate}
                className="flex-1 bg-[#3c3c3c] text-[#cccccc] px-1 py-0 text-xs border border-[#007acc] rounded focus:outline-none"
                placeholder={`${isCreating} name`}
                autoFocus
              />
            </div>
          )}

          {item.children?.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteItem={onDeleteItem} // <-- pass down
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  rootFolder,
  activeFile,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteItem, // <-- add prop
}) => {
  return (
    <div className="h-full bg-[#252526] border-r border-[#3c3c3c] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#3c3c3c]">
        <span className="text-xs font-medium text-[#cccccc] uppercase tracking-wide">
          Explorer
        </span>
      </div>
      <div className="py-2">
        <FileTreeItem
          item={rootFolder}
          level={0}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteItem={onDeleteItem} // <-- pass down
        />
      </div>
    </div>
  );
};
