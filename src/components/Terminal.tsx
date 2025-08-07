import React, { useState, useRef, useEffect } from "react";
import { Braces, Terminal as TerminalIcon, Trash2 } from "lucide-react";
import { FileSystemItem } from "../types";
import { ApiService } from "../services/api";

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

  const addLine = (type: "input" | "output" | "error", content: string) => {
    setLines((prev) => [...prev, { type, content, timestamp: new Date() }]);
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
          addLine("output", "Available commands:");
          addLine("output", "  clear          - Clear terminal");
          addLine("output", "  pwd            - Show current directory");
          addLine("output", "  ls             - List files");
          addLine("output", "  kit init       - Initialize Kit repository");
          addLine("output", "  kit add <file> - Add file to staging");
          addLine("output", '  kit commit -m "message" - Commit changes');
          addLine("output", "  kit status     - Show repository status");
          addLine("output", "  kit log        - Show commit history");
          addLine("output", "  kit branch     - List branches");
          addLine("output", "  kit checkout <branch> - Switch branch");
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
          if (response.success)
            addLine("output", `Added ${args[0]} to staging area`);
          else addLine("error", `Failed to add files: ${response.error}`);
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
        addLine("output", "Kit Status:");
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
            addLine(
              "output",
              `${entry.hash} - ${entry.message} (${entry.author}) [${entry.date}]`
            );
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
            for (const branch of response.data) {
              if (currentBranch === branch) {
                addLine("output", "*" + branch);
                continue;
              }
              addLine("output", branch);
            }
          }
          return;
        }
        const branchName = args[0];
        const branchResponse = await ApiService.createBranch(
          username,
          branchName
        );
        if (!branchResponse.success) {
          addLine("error", `Failed to create branch: ${branchResponse.error}`);
          return;
        }
        addLine("output", "Branch created successfully");
        break;
      case "checkout":
        if (!isKitInitialized) {
          addLine("error", 'Not a Kit repository. Run "kit init" first.');
          return;
        }
        if (args.length === 0) {
          addLine("error", "Usage: kit checkout <branch>");
        } else {
          const newBranch = args[0];
          const checkoutResponse = await ApiService.checkoutBranch(
            username,
            newBranch
          );

          if (!checkoutResponse.success) {
            addLine(
              "error",
              `Failed to switch branch: ${checkoutResponse.error}`
            );
            return;
          }
          setCurrentBranch(newBranch);
          if (
            onReplaceFileSystem &&
            checkoutResponse.success &&
            checkoutResponse.data
          ) {
            onReplaceFileSystem(checkoutResponse.data);
          }
          addLine("output", `Switched to branch '${newBranch}'`);
        }
        break;

      default:
        addLine(
          "error",
          `Unknown kit command: ${subCommand}. Type 'help' for available commands.`
        );
    }
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      {/* Terminal Header */}
      <div className="h-8 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-[#cccccc]" />
          <span className="text-xs text-[#cccccc]">Terminal</span>
          {isKitInitialized && (
            <span className="text-xs text-[#569cd6] bg-[#1e1e1e] px-2 py-0.5 rounded">
              {currentBranch}
            </span>
          )}
        </div>
        <button
          onClick={clearTerminal}
          className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
          title="Clear terminal"
        >
          <Trash2 className="w-3 h-3 text-[#cccccc]" />
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm"
      >
        {lines.map((line, index) => (
          <div key={index} className="mb-1">
            <span
              className={
                line.type === "input"
                  ? "text-white font-medium"
                  : line.type === "error"
                  ? "text-[#f48771]"
                  : "text-[#9cdcfe]"
              }
            >
              {line.content}
            </span>
          </div>
        ))}
      </div>

      {/* Terminal Input */}
      <div className="border-t border-[#3c3c3c] p-3">
        <div className="flex items-center space-x-2 font-mono text-sm">
          <span className="text-[#569cd6]">{username}</span>
          <span className="text-[#cccccc]">@</span>
          <span className="text-[#4ec9b0]">kit</span>
          <span className="text-[#cccccc]">:</span>
          <span className="text-[#4ec9b0]">~</span>
          <span className="text-[#cccccc]">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-[#cccccc] focus:outline-none ml-2"
            placeholder={
              isProcessing
                ? "Processing..."
                : "Type command... (Tab: autocomplete, ↑↓: history)"
            }
            autoFocus
          />
          {isProcessing && (
            <div className="w-4 h-4 border-2 border-[#569cd6] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>
    </div>
  );
};
