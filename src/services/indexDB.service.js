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

// Function to export data from IndexedDB
export async function exportData() {
	const db1 = await initializeDB("ChatApp");
	const db2 = await initDB("RSAKeys");

	const data = {};

	data.messageHistory = await exportStoreData(db1, "messageHistory");
	data.latestMessage = await exportStoreData(db1, "latestMessage");

	data.keys = await exportStoreData(db2, "keys");

	const jsonData = JSON.stringify(data);

	return jsonData;
}

// Helper function to export data from a specific object store
async function exportStoreData(db, storeName) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readonly");
		const objectStore = transaction.objectStore(storeName);

		const request = objectStore.getAll();

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onerror = (event) => {
			reject(event.target.error);
		};
	});
}

// Function to import data into IndexedDB
export async function importData(jsonData) {
	// Parse the JSON data
	const data = JSON.parse(jsonData);

	// Open both databases
	const db1 = await initializeDB("ChatApp"); // Replace with your actual database name
	const db2 = await initDB("RSAKeys");

	await importStoreData(db1, "messageHistory", data.messageHistory);
	await importStoreData(db1, "latestMessage", data.latestMessage);

	// Import data into RSAKeys
	await importStoreData(db2, "keys", data.keys);
}

// Helper function to import data into a specific object store
async function importStoreData(db, storeName, dataArray) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, "readwrite");
		const objectStore = transaction.objectStore(storeName);

		dataArray.forEach((data) => {
			objectStore.put(data);
		});

		transaction.oncomplete = () => {
			resolve();
		};

		transaction.onerror = (event) => {
			reject(event.target.error);
		};
	});
}
