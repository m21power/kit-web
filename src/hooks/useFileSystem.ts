import { useState, useCallback } from "react";
import { FileSystemItem } from "../types";

export const useFileSystem = (username: string) => {
  const [rootFolder, setRootFolder] = useState<FileSystemItem>({
    id: username,
    name: username,
    type: "folder",
    path: username,
    children: [
      {
        id: `${username}/README.md`,
        name: "README.md",
        type: "file",
        content: `# ${username}'s Repository\n\nWelcome to your Kit repository!`,
        path: `${username}/README.md`,
      },
    ],
  });

  const [activeFile, setActiveFile] = useState<FileSystemItem | null>(null);

  const findItemByPath = useCallback(
    (
      path: string,
      item: FileSystemItem = rootFolder
    ): FileSystemItem | null => {
      if (item.path === path) return item;
      if (item.children) {
        for (const child of item.children) {
          const found = findItemByPath(path, child);
          if (found) return found;
        }
      }
      return null;
    },
    [rootFolder]
  );

  const updateItem = useCallback(
    (path: string, updates: Partial<FileSystemItem>) => {
      const updateRecursive = (item: FileSystemItem): FileSystemItem => {
        if (item.path === path) {
          return { ...item, ...updates };
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map(updateRecursive),
          };
        }
        return item;
      };

      setRootFolder(updateRecursive(rootFolder));
    },
    [rootFolder]
  );

  const addItem = useCallback(
    (parentPath: string, newItem: FileSystemItem) => {
      const addRecursive = (item: FileSystemItem): FileSystemItem => {
        if (item.path === parentPath) {
          return {
            ...item,
            children: [...(item.children || []), newItem],
          };
        }
        if (item.children) {
          return {
            ...item,
            children: item.children.map(addRecursive),
          };
        }
        return item;
      };

      setRootFolder(addRecursive(rootFolder));
    },
    [rootFolder]
  );

  const deleteItem = useCallback(
    (path: string) => {
      const deleteRecursive = (item: FileSystemItem): FileSystemItem => {
        if (item.children) {
          return {
            ...item,
            children: item.children
              .filter((child) => child.path !== path)
              .map(deleteRecursive),
          };
        }
        return item;
      };

      setRootFolder(deleteRecursive(rootFolder));
      if (activeFile?.path === path) {
        setActiveFile(null);
      }
    },
    [rootFolder, activeFile]
  );

  const replaceFileSystem = useCallback((newRoot: FileSystemItem) => {
    setRootFolder(newRoot);
  }, []);

  return {
    rootFolder,
    setRootFolder,
    activeFile,
    setActiveFile,
    findItemByPath,
    updateItem,
    addItem,
    deleteItem,
    replaceFileSystem,
  };
};
