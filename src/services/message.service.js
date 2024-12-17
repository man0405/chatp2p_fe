import { initializeDB } from "@/services/indexDB.service";

export const storeMessageHistory = async ({
  keys,
  sender,
  message,
  type,
  file,
  downloadUrl,
  fileName,
}) => {
  try {
    const db = await initializeDB("ChatApp");
    const tx = db.transaction("messageHistory", "readwrite");
    const store = tx.objectStore("messageHistory");

    const newMessage = {
      keys,
      sender,
      message, // Store message text only if not a file
      type,
      file: type === "file" ? file : null, // Store file as a Blob if it's a file message
      fileName: type === "file" ? fileName : null,
      downloadUrl,
      timestamp: Date.now(),
    };

    await new Promise((resolve, reject) => {
      const request = store.add(newMessage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await tx.done;
  } catch (error) {
    console.error("Error storing message history:", error);
  }
};

export const getMessageHistory = async (keys) => {
  try {
    const db = await initializeDB("ChatApp");
    const tx = db.transaction("messageHistory", "readonly");
    const store = tx.objectStore("messageHistory");
    const index = store.index("keys");

    const messages = await new Promise((resolve, reject) => {
      const request = index.getAll(keys);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await tx.done;

    messages.sort((a, b) => -b.timestamp + a.timestamp);

    return messages.map((msg) => {
      if (msg.type === "file" && msg.file) {
        const downloadUrl = URL.createObjectURL(msg.file);
        return { ...msg, downloadUrl };
      }
      return msg;
    });
  } catch (error) {
    console.error("Error getting message history:", error);
    return [];
  }
};

export const getPageMessageHistory = async (keys, limit = 50, offset = 0) => {
  try {
    const db = await initializeDB("ChatApp");
    const tx = db.transaction("messageHistory", "readonly");
    const store = tx.objectStore("messageHistory");
    const index = store.index("keys");

    const messages = [];
    let counter = 0;

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(keys), "next");

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && counter < offset + limit) {
          if (counter >= offset) {
            messages.push(cursor.value);
          }
          counter++;
          cursor.continue();
        } else {
          resolve(messages);
        }
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("Error getting message history:", error);
    return [];
  }
};

export const storeLatestMessage = async ({
  keys,
  fullName,
  message,
  type,
  publicKey,
}) => {
  try {
    if (!keys || typeof keys !== "string") {
      throw new Error("Invalid key: `keys` must be a non-empty string.");
    }

    const db = await initializeDB("ChatApp");
    const tx = db.transaction("latestMessage", "readwrite");
    const store = tx.objectStore("latestMessage");

    const newMessage = {
      keys, // This must match the keyPath defined in initializeDB
      fullName,
      message,
      type,
      publicKey,
      timestamp: Date.now(),
    };

    await new Promise((resolve, reject) => {
      const request = store.put(newMessage); // Insert or update
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await tx.done;
  } catch (error) {
    console.error("Error storing latest message:", error);
  }
};

// Get all latest messages in the database
export const getLatestMessages = async () => {
  try {
    const db = await initializeDB("ChatApp");
    const tx = db.transaction("latestMessage", "readonly");
    const store = tx.objectStore("latestMessage");

    // Query all latest messages
    const messages = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await tx.done;

    messages.sort((a, b) => b.timestamp - a.timestamp);

    return messages;
  } catch (error) {
    console.error("Error getting latest messages:", error);
    return [];
  }
};
