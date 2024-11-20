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
