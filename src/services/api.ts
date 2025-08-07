import { ApiResponse, FileSystemItem, KitStatus, KitLogEntry } from "../types";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"; // Uses env variable if set

export class ApiService {
  static async checkUsername(
    username: string
  ): Promise<ApiResponse<{ available: boolean }>> {
    const response = await fetch(
      `${API_BASE_URL}/check?username=${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status === 400) {
      return {
        success: false,
        data: { available: false },
      };
    } else {
      return {
        success: true,
        data: { available: true },
      };
    }
  }
  static async waitForIt(
    delayMs: number
  ): Promise<ApiResponse<{ waited: number }>> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return {
      success: true,
      data: { waited: delayMs },
    };
  }
  static async initRepository(
    username: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      return {
        success: false,
        data: { success: false },
      };
    }

    return {
      success: true,
      data: { success: true },
    };
  }

  static async addFiles(
    username: string,
    files: string[],
    rootFolder: FileSystemItem
  ): Promise<ApiResponse<FileSystemItem>> {
    const response = await fetch(`${API_BASE_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, files, rootFolder }),
    });
    if (!response.ok) {
      return {
        success: false,
        data: rootFolder,
      };
    }
    return {
      success: true,
      data: rootFolder,
    };
  }

  static async commit(
    username: string,
    message: string
  ): Promise<ApiResponse<string>> {
    const response = await fetch(`${API_BASE_URL}/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, message }),
    });

    if (!response.ok) {
      return {
        success: false,
        data: "",
      };
    }

    const { hash } = await response.json();
    return {
      success: true,
      data: `[main ${hash}] ${message}`,
    };
  }

  static async getStatus(
    username: string,
    rootFolder: FileSystemItem
  ): Promise<ApiResponse<KitStatus>> {
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, rootFolder }),
    });
    const responseBody = await response.clone().json();
    console.log("getStatus response body:", responseBody);
    console.log("getStatus response status:", response.status);
    if (!response.ok) {
      return {
        success: false,
        data: {
          branch: "main",
          staged: ["src/main.ts"],
          modified: ["README.md"],
          untracked: ["temp.txt"],
        },
      };
    }
    const data = await response.json();
    return {
      success: true,
      data: {
        branch: data.branch,
        staged: data.staged || [],
        modified: data.modified || [],
        untracked: data.untracked || [],
      },
    };
  }

  static async getLog(username: string): Promise<ApiResponse<KitLogEntry[]>> {
    const response = await fetch(`${API_BASE_URL}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      return {
        success: false,
        data: [],
      };
    }

    const responseData = await response.json();
    console.log("getLog response data:", responseData);

    // Map the logs from API response to KitLogEntry[]
    const logs = (responseData.data?.logs || []).map((log: any) => ({
      hash: log.Hash,
      message: log.Message.trim(),
      author: log.Author,
      date: log.Date.replace("T", " ").replace("Z", ""),
    }));

    return {
      success: true,
      data: logs,
    };
  }

  static async createBranch(
    username: string,
    branch: string
  ): Promise<ApiResponse<string>> {
    const response = await fetch(`${API_BASE_URL}/branch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, branch }),
    });
    if (!response.ok) {
      return {
        success: false,
        data: `Failed to create branch '${branch}'`,
      };
    }
    return {
      success: true,
      data: `Switched to a new branch '${branch}'`,
    };
  }
  static async listBranches(username: string): Promise<ApiResponse<string[]>> {
    const response = await fetch(
      `${API_BASE_URL}/branches?username=${username}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
      };
    }

    const responseData = await response.json();

    return {
      success: true,
      data: responseData.data.branches,
    };
  }

  static async checkoutBranch(
    username: string,
    branch: string
  ): Promise<ApiResponse<FileSystemItem>> {
    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, branch }),
    });

    const responseData = await response.json();
    console.log("checkoutBranch response data:", responseData);
    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || `Failed to checkout branch '${branch}'`,
      };
    }

    function cleanPaths(item: FileSystemItem): FileSystemItem {
      const prefixToRemove = `workspaces/${username}/`;

      const removePrefix = (str?: string): string =>
        str && str.startsWith(prefixToRemove)
          ? str.slice(prefixToRemove.length)
          : str || "";

      return {
        ...item,
        id: removePrefix(item.id),
        path: removePrefix(item.path),
        children: item.children?.map(cleanPaths),
      };
    }

    const cleaned = cleanPaths(responseData.data.data);
    const actualRoot = cleaned.children?.[0]; // This is workspaces/biruk/biruk

    if (!actualRoot) {
      return { success: false, error: "Invalid repo structure." };
    }
    console.log("✅ Cleaned structure:");
    function walkDir(item: FileSystemItem, indent: string = "") {
      const icon = item.type === "folder" ? "📁" : "📄";
      console.log(`${indent}${icon} ${item.name}`);

      if (item.children) {
        for (const child of item.children) {
          walkDir(child, indent + "  ");
        }
      }
    }

    walkDir(actualRoot);

    return {
      success: true,
      data: actualRoot,
    };
  }

  static async submitRating(
    username: string,
    rating: number
  ): Promise<
    ApiResponse<{
      averageRating: number;
      totalRatings: number;
      userRating: number;
    }>
  > {
    const ratingRef = doc(db, "ratings", username);

    await setDoc(ratingRef, {
      rating,
      updatedAt: Timestamp.now(),
    });

    const snapshot = await getDocs(collection(db, "ratings"));
    let total = 0;
    let sum = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.rating === "number") {
        total += 1;
        sum += data.rating;
      }
    });

    const averageRating =
      total === 0 ? 0 : parseFloat((sum / total).toFixed(1));

    return {
      success: true,
      data: {
        averageRating,
        totalRatings: total,
        userRating: rating,
      },
    };
  }
  static async getRating(username: string): Promise<
    ApiResponse<{
      averageRating: number;
      totalRatings: number;
      userRating: number | null;
    }>
  > {
    const snapshot = await getDocs(collection(db, "ratings"));
    let total = 0;
    let sum = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.rating === "number") {
        total += 1;
        sum += data.rating;
      }
    });

    const averageRating =
      total === 0 ? 0 : parseFloat((sum / total).toFixed(1));

    // Fetch user rating
    const userDoc = await getDoc(doc(db, "ratings", username));
    const userRating = userDoc.exists()
      ? (userDoc.data().rating as number)
      : null;

    return {
      success: true,
      data: {
        averageRating,
        totalRatings: total,
        userRating,
      },
    };
  }

  static async sendFeedback(
    username: string,
    feedback: string,
    fullName?: string
  ): Promise<ApiResponse<string>> {
    const botToken = import.meta.env.VITE_BOT_TOKEN;
    const chatId = import.meta.env.VITE_CHAT_ID;
    const message = [
      "📝 Feedback Received",
      `👤 User: ${username}${fullName ? ` (${fullName})` : ""}`,
      "💬 Message:",
      feedback,
    ].join("\n\n");

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}`;

    try {
      const response = await fetch(telegramUrl, { method: "POST" });
      if (!response.ok) throw new Error("Telegram API error");
      return {
        success: true,
        data: "Feedback sent successfully",
      };
    } catch (error) {
      console.error("Failed to send feedback to Telegram:", error);
      return {
        success: false,
        data: "Failed to send feedback",
      };
    }
  }
}
