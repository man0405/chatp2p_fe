async function initDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("RSAKeyStore", 1);
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

export async function getStoredKeys() {
	const db = await initDB();
	const tx = db.transaction("keys", "readonly");
	const store = tx.objectStore("keys  ");

	const publicKeyJWK = await store.get("publicKey");
	const privateKeyJWK = await store.get("privateKey");

	if (!publicKeyJWK || !privateKeyJWK) return null;

	const publicKey = await window.crypto.subtle.importKey(
		"jwk",
		publicKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["encrypt"]
	);

	const privateKey = await window.crypto.subtle.importKey(
		"jwk",
		privateKeyJWK,
		{
			name: "RSA-OAEP",
			hash: { name: "SHA-256" },
		},
		true,
		["decrypt"]
	);

	return { publicKey, privateKey };
}

export async function generateAndStoreKeys() {
	const keyPair = await window.crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: "SHA-256" },
		},
		true,
		["encrypt", "decrypt"]
	);

	const db = await initDB();
	const tx = db.transaction("keys", "readwrite");
	const store = tx.objectStore("keys");

	const exportedPublicKey = await window.crypto.subtle.exportKey(
		"jwk",
		keyPair.publicKey
	);
	const exportedPrivateKey = await window.crypto.subtle.exportKey(
		"jwk",
		keyPair.privateKey
	);

	await Promise.all([
		store.put(exportedPublicKey, "publicKey"),
		store.put(exportedPrivateKey, "privateKey"),
	]);

	return keyPair;
}

export async function encrypt(data, publicKey) {
	const buffer = new TextEncoder().encode(data);
	const encrypted = await window.crypto.subtle.encrypt(
		{
			name: "RSA-OAEP",
		},
		publicKey,
		buffer
	);
	return arrayBufferToBase64(encrypted);
}

export async function decrypt(encryptedData, privateKey) {
	const buffer = base64ToArrayBuffer(encryptedData);
	const decrypted = await window.crypto.subtle.decrypt(
		{
			name: "RSA-OAEP",
		},
		privateKey,
		buffer
	);
	return new TextDecoder().decode(decrypted);
}

export function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	return btoa(String.fromCharCode.apply(null, bytes));
}

export function base64ToArrayBuffer(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}
