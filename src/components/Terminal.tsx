import React, { useState, useRef, useEffect } from "react";
import { Braces, Terminal as TerminalIcon, Trash2 } from "lucide-react";
import { FileSystemItem } from "../types";
import { ApiService } from "../services/api";
import { on } from "events";

interface TerminalProps {
  username: string;
  rootFolder: FileSystemItem;
  onFolderUpdate: (folder: FileSystemItem) => void;
  onReplaceFileSystem?: (newRoot: FileSystemItem) => void; // Add this prop
}

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
  timestamp: Date;
  gitType?:
    | "staged"
    | "modified"
    | "untracked"
    | "deleted"
    | "commit"
    | "author"
    | "date"
    | "message";
}

export const Terminal: React.FC<TerminalProps> = ({
  username,
  rootFolder,
  onFolderUpdate,
  onReplaceFileSystem,
}) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: "output",
      content: 'Welcome to Kit Terminal! Type "help" for available commands.',
      timestamp: new Date(),
    },
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBranch, setCurrentBranch] = useState("main");

  const [isKitInitialized, setIsKitInitialized] = useState(false);

  useEffect(() => {
    const checkKitInitialized = async () => {
      const response = await ApiService.checkUsername(username);
      setIsKitInitialized(!response.success);
    };
    checkKitInitialized();
  }, [username]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (
    type: "input" | "output" | "error",
    content: string,
    gitType?:
      | "staged"
      | "modified"
      | "untracked"
      | "deleted"
      | "commit"
      | "author"
      | "date"
      | "message"
  ) => {
    setLines((prev) => [
      ...prev,
      { type, content, timestamp: new Date(), gitType },
    ]);
  };

  const clearTerminal = () => {
    setLines([]);
  };

  const getAvailableCommands = () => {
    const baseCommands = ["clear", "pwd", "ls", "help"];
    const kitCommands = [
      "init",
      "add",
      "commit",
      "status",
      "log",
      "branch",
      "checkout",
      "restore",
      "reset",
    ];
    return [...baseCommands, ...kitCommands.map((cmd) => `kit ${cmd}`)];
  };

  const getAvailableFiles = () => {
    const getAllFiles = (item: FileSystemItem, prefix = ""): string[] => {
      const files: string[] = [];
      if (item.children) {
        for (const child of item.children) {
          if (child.name !== ".kit") {
            const childPath = prefix ? `${prefix}/${child.name}` : child.name;
            files.push(childPath);
            if (child.type === "folder") {
              files.push(...getAllFiles(child, childPath));
            }
          }
        }
      }
      return files;
    };
    return getAllFiles(rootFolder);
  };

  const handleTabCompletion = (input: string): string => {
    const parts = input.trim().split(" ");
    const lastPart = parts[parts.length - 1];

    // If it's the first word, complete commands
    if (parts.length === 1) {
      const commands = getAvailableCommands();
      const matches = commands.filter((cmd) => cmd.startsWith(lastPart));
      if (matches.length === 1) {
        return matches[0];
      } else if (matches.length > 1) {
        addLine("output", matches.join("  "));
        return input;
      }
    }

    // If it's a kit command, complete subcommands
    if (parts.length === 2 && parts[0] === "kit") {
      const kitSubcommands = [
        "init",
        "add",
        "commit",
        "status",
        "log",
        "branch",
        "checkout",
        "restore",
        "reset",
      ];
      const matches = kitSubcommands.filter((cmd) => cmd.startsWith(lastPart));
      if (matches.length === 1) {
        return `kit ${matches[0]}`;
      } else if (matches.length > 1) {
        addLine("output", matches.map((cmd) => `kit ${cmd}`).join("  "));
        return input;
      }
    }

    // Complete file paths for certain commands
    if (
      parts.length >= 2 &&
      parts[0] === "kit" &&
      ["add", "checkout"].includes(parts[1])
    ) {
      const files = getAvailableFiles();
      const matches = files.filter((file) => file.startsWith(lastPart));
      if (matches.length === 1) {
        const newParts = [...parts];
        newParts[newParts.length - 1] = matches[0];
        return newParts.join(" ");
      } else if (matches.length > 1) {
        addLine("output", matches.join("  "));
        return input;
      }
    }

    return input;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
    setHistoryIndex(-1); // Reset history navigation when typing
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentInput.trim() && !isProcessing) {
        executeCommand(currentInput.trim());
        setCurrentInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completed = handleTabCompletion(currentInput);
      setCurrentInput(completed);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    }
  };

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    addLine("input", `${username}@kit:~$ ${trimmedCommand}`);

    // Add to command history (avoid duplicates)
    if (commandHistory[0] !== trimmedCommand) {
      setCommandHistory((prev) => [trimmedCommand, ...prev.slice(0, 49)]);
    }
    setHistoryIndex(-1);

    setIsProcessing(true);

    try {
      const parts = trimmedCommand.split(" ");
      const mainCommand = parts[0];
      const subCommand = parts[1];

      switch (mainCommand) {
        case "clear":
          clearTerminal();
          break;

        case "help":
          addLine("output", "Available commands:", "commit");
          addLine("output", "  · clear          - Clear terminal", "author");
          addLine(
            "output",
            "  · pwd            - Show current directory",
            "author"
          );
          addLine("output", "  · ls             - List files", "author");
          addLine(
            "output",
            "  · kit init       - Initialize Kit repository",
            "author"
          );
          addLine(
            "output",
            "  · kit add <file> - Add file to staging",
            "author"
          );
          addLine(
            "output",
            '  · kit commit -m "message" - Commit changes',
            "author"
          );
          addLine(
            "output",
            "  · kit status     - Show repository status",
            "author"
          );
          addLine(
            "output",
            "  · kit log        - Show commit history",
            "author"
          );
          addLine("output", "  · kit branch     - List branches", "author");
          addLine(
            "output",
            "  · kit checkout <branch> - Switch branch",
            "author"
          );
          addLine(
            "output",
            "  · kit restore <file> - Restore deleted file",
            "author"
          );
          addLine(
            "output",
            "  · kit reset <hash>  - Reset to a specific commit",
            "author"
          );
          break;

        case "pwd":
          addLine("output", `/${username}`);
          break;

        case "ls":
          if (rootFolder.children) {
            const items = rootFolder.children
              .filter((item) => item.name !== ".kit")
              .map((item) =>
                item.type === "folder" ? `${item.name}/` : item.name
              )
              .join("  ");
            addLine("output", items || "No files found");
          } else {
            addLine("output", "No files found");
          }
          break;

        case "kit":
          await handleKitCommand(subCommand, parts.slice(2));
          break;

        default:
          addLine(
            "error",
            `Command not found: ${mainCommand}. Type 'help' for available commands.`
          );
      }
    } catch (error) {
      addLine("error", `Error executing command: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKitCommand = async (subCommand: string, args: string[]) => {
    switch (subCommand) {
      case "init":
        if (isKitInitialized) {
          addLine("error", "Kit repository already initialized");
        } else {
          const response = await ApiService.initRepository(username);
          if (response.success) {
            setIsKitInitialized(true);
            // onFolderUpdate(response.data);
            addLine("output", "Initialized empty Kit repository");
          } else {
            setIsKitInitialized(false);
            addLine("error", "Failed to initialize Kit repository");
          }
        }
        break;

      case "add":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        if (args.length === 0) {
          addLine("error", "Usage: kit add <file>");
        } else {
          const response = await ApiService.addFiles(
            username,
            args,
            rootFolder
          );
          if (response.success) {
            if (response.data && response.data.files) {
              addLine(
                "output",
                response.data.message || "Files added successfully"
              );

              response.data.files.forEach((file) => {
                addLine("output", `Staged ${file}`);
              });
            }
          } else {
            addLine("error", `Failed to add files: ${response.error}`);
          }
        }
        break;

      case "commit":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        if (args.length < 2 || args[0] !== "-m") {
          addLine("error", 'Usage: kit commit -m "commit message"');
        } else {
          const message = args.slice(1).join(" ").replace(/['"]/g, "");
          const response = await ApiService.commit(username, message);
          if (!response.success) {
            addLine("error", `Failed to commit changes: ${response.error}`);
            return;
          }
          addLine("output", `Committed changes: ${message}`);
        }
        break;

      case "status":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        const statusResponse = await ApiService.getStatus(username, rootFolder);
        if (!statusResponse.success) {
          addLine("error", `Failed to get status: ${statusResponse.error}`);
          return;
        }
        const statusData = statusResponse.data;
        if (statusData) {
          if (statusData.deleted.length > 0) {
            addLine(
              "output",
              "Deleted files detected. You can restore individual files using 'kit restore <file>' or restore all deleted files with 'kit restore'.",
              "deleted"
            );
            statusData.deleted.forEach((file) => {
              addLine("output", `  deleted: ${file}`, "deleted");
            });
          }
          if (statusData.staged.length > 0) {
            addLine("output", "Staged files:", "staged");
            statusData.staged.forEach((file) => {
              addLine("output", `  staged: ${file}`, "staged");
            });
          }
          if (statusData.modified.length > 0) {
            addLine("output", "Modified files:", "modified");
            statusData.modified.forEach((file) => {
              addLine("output", `  modified: ${file}`, "modified");
            });
          }
          if (statusData.untracked.length > 0) {
            addLine("output", "Untracked files:", "untracked");
            statusData.untracked.forEach((file) => {
              addLine("output", `  untracked: ${file}`, "untracked");
            });
          }
        } else {
          addLine("output", "No changes detected");
        }
        break;

      case "log":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        const logResponse = await ApiService.getLog(username);
        if (!logResponse.success) {
          addLine("error", `Failed to get log: ${logResponse.error}`);
          return;
        }
        addLine("output", "Kit Log:");
        if (logResponse.data) {
          logResponse.data.forEach((entry) => {
            addLine("output", `commit ${entry.hash}`, "commit"); // hash line
            addLine("output", `Author: ${entry.author}`, "author"); // author line
            addLine("output", `Date: ${entry.date}`, "date"); // date line
            addLine("output", `    ${entry.message}`, "message"); // message line
            addLine(
              "output",
              "***********************************************",
              "commit"
            ); // spacing
          });
        }
        break;

      case "branch":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        if (args.length < 1) {
          const response = await ApiService.listBranches(username);
          if (response.success && response.data) {
            addLine(
              "output",
              "Branches: Use 'kit checkout <branch>' to switch"
            );
            response.data.forEach((branch) => {
              if (branch === currentBranch) {
                addLine("output", `* ${branch}`, "commit");
              } else {
                addLine("output", `  ${branch}`);
              }
            });
          } else {
            addLine("error", `Failed to list branches: ${response.error}`);
          }
        } else {
          const branchName = args[0];

          const response = await ApiService.createBranch(username, branchName);
          if (response.success) {
            addLine("output", `Branch created: ${branchName}`);
          } else {
            addLine("error", `Failed to create branch: ${response.error}`);
          }
        }
        break;

      case "checkout":
        if (args.length < 1) {
          addLine("error", "Usage: kit checkout <branch-name>");
        } else {
          const branchName = args[0];
          const response = await ApiService.checkoutBranch(
            username,
            branchName
          );
          if (response.success) {
            setCurrentBranch(branchName);
            addLine("output", `Switched to branch: ${branchName}`);
            // Optionally, update the file system view here
            if (response.data) {
              onFolderUpdate(response.data);
            }
          } else {
            addLine("error", `Failed to switch branch: ${response.error}`);
          }
        }
        break;
      case "restore":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }

        const fileToRestore = [];
        for (const arg of args) {
          fileToRestore.push(arg);
        }
        const response = await ApiService.restoreFiles(username, fileToRestore);
        if (!response.success) {
          addLine("error", `Failed to restore files: ${response.error}`);
        }
        response.data?.files.forEach((file) => {
          if (file.restored) {
            addLine("output", `Restored file: ${file.path}`, "staged");
          } else {
            addLine("error", `Failed to restore file: ${file.path}`);
          }
        });
        onReplaceFileSystem?.(response.data?.fileSystem || rootFolder);
        break;
      case "reset":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        if (args.length < 1) {
          addLine("error", "Usage: kit reset <commit-hash>");
          return;
        }
        const commitHash = args[0];
        const resetResponse = await ApiService.resetKit(username, commitHash);
        if (resetResponse.success) {
          addLine("output", `Reset to commit: ${commitHash}`);
          // Optionally, update the file system view here
          if (resetResponse.data) {
            onReplaceFileSystem?.(resetResponse.data);
          }
        } else {
          addLine("error", `Failed to reset: ${resetResponse.error}`);
        }
        break;
      default:
        addLine("error", `Unknown command: ${subCommand}`);
    }
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      {/* Terminal Header */}
      <div className="h-8 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between px-3">
        <div className="flex items-center gap-4">
          <span className="terminal-title text-lg font-bold text-[#4ec9b0]">
            Terminal
          </span>
          <span className="text-sm text-[#dcdcaa] bg-[#232323] px-2 py-1 rounded">
            <span className="font-semibold">{currentBranch}</span>
          </span>
        </div>
        <div className="terminal-controls">
          <button
            className="terminal-button flex items-center gap-1 px-2 py-1 rounded hover:bg-[#232323] transition-colors text-[#f48771]"
            title="Clear Terminal"
            onClick={() => {
              clearTerminal();
            }}
          >
            <Trash2 size={16} />
            <span className="hidden md:inline">Clear</span>
          </button>
        </div>
      </div>
      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm"
        style={{ maxHeight: "100%", minHeight: 0 }}
      >
        {lines.map((line, index) => (
          <div key={index} className={`mb-1`}>
            <span
              className={
                line.type === "input"
                  ? "text-white font-medium"
                  : line.type === "error"
                  ? "text-[#f48771]"
                  : line.gitType === "staged"
                  ? "text-green-400"
                  : line.gitType === "modified"
                  ? "text-yellow-400"
                  : line.gitType === "untracked"
                  ? "text-blue-400"
                  : line.gitType === "deleted"
                  ? "text-red-400"
                  : line.gitType === "commit" &&
                    line.content.startsWith("commit ")
                  ? "text-purple-400 font-bold"
                  : line.gitType === "author"
                  ? "text-cyan-400"
                  : line.gitType === "date"
                  ? "text-gray-400"
                  : line.gitType === "message"
                  ? "text-white"
                  : "text-[#9cdcfe]"
              }
            >
              {line.content}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div className="mb-1 flex items-center gap-2 animate-pulse">
            <span className="text-[#4ec9b0] font-semibold">
              <TerminalIcon className="inline-block mr-1" size={16} />
              Processing...
            </span>
          </div>
        )}
      </div>
      {/* Terminal Input */}
      <div className="border-t border-[#3c3c3c] p-3 flex items-center">
        <span className="terminal-prompt text-[#569cd6] font-semibold">{`${username}@kit:~$`}</span>
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent text-white outline-none ml-2 flex-1 w-full"
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
};
