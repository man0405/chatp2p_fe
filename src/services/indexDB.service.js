// for store public and private key in indexDB
export async function initDB(name, version = 1) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(name, version);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains("keys")) {
				db.createObjectStore("keys");
			}
		};
	});
}

// for store normal table in indexDB
export const initNormalDB = async (dbName, storeName, version = 1) => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, version);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName);
			}
		};
	});
};

// for message store in indexDB
export function initializeDB(dbName, version = 1) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, version);

		request.onupgradeneeded = (event) => {
			const db = event.target.result;

			// Ensure `messageHistory` store exists
			if (!db.objectStoreNames.contains("messageHistory")) {
				const messageHistoryStore = db.createObjectStore("messageHistory", {
					keyPath: "id",
					autoIncrement: true,
				});
				messageHistoryStore.createIndex("keys", "keys", { unique: false });
				messageHistoryStore.createIndex("timestamp", "timestamp", {
					unique: false,
				});
			}

			// Ensure `latestMessage` store exists
			if (!db.objectStoreNames.contains("latestMessage")) {
				const latestMessageStore = db.createObjectStore("latestMessage", {
					keyPath: "keys", // Use `keys` as the primary key
				});
			}
		};

		request.onsuccess = (event) => {
			resolve(event.target.result);
		};

		request.onerror = (event) => {
			reject(event.target.error);
		};
	});
}
