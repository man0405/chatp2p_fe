// src/utils/rsa.js

import { initDB } from "@/services/indexDB.service";

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	bytes.forEach((b) => (binary += String.fromCharCode(b)));
	return window.btoa(binary);
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
	try {
		// Remove any whitespace
		base64 = base64.replace(/\s/g, "");
		const binary = window.atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	} catch (error) {
		console.error("Base64 conversion error:", error);
		throw new Error("Invalid base64 string");
	}
}

// Function to convert CryptoKey to PEM format
async function exportKeyToPEM(key, type) {
	let exported;
	if (type === "public") {
		exported = await window.crypto.subtle.exportKey("spki", key);
	} else if (type === "private") {
		exported = await window.crypto.subtle.exportKey("pkcs8", key);
	} else {
		throw new Error("Invalid key type");
	}

	const exportedAsBase64 = arrayBufferToBase64(exported);
	const pemHeader =
		type === "public"
			? "-----BEGIN PUBLIC KEY-----\n"
			: "-----BEGIN PRIVATE KEY-----\n";
	const pemFooter =
		type === "public"
			? "\n-----END PUBLIC KEY-----"
			: "\n-----END PRIVATE KEY-----";
	const pemBody = exportedAsBase64.match(/.{1,64}/g).join("\n");

	return pemHeader + pemBody + pemFooter;
}

// Helper function to remove PEM headers/footers and decode Base64
function pemToArrayBuffer(pem) {
	const b64 = pem
		.replace(/-----BEGIN (.*)-----/, "")
		.replace(/-----END (.*)-----/, "")
		.replace(/\n/g, "");
	return base64ToArrayBuffer(b64);
}

// Function to import PEM-formatted keys back into CryptoKey objects
async function importPEMKey(pem, type) {
	console.log("Pem pk", pem);
	const arrayBuffer = pemToArrayBuffer(pem);
	if (type === "public") {
		return await window.crypto.subtle.importKey(
			"spki",
			arrayBuffer,
			{
				name: "RSA-OAEP",
				hash: { name: "SHA-256" },
			},
			true,
			["encrypt"]
		);
	} else if (type === "private") {
		console.log("Importing private key...");
		return await window.crypto.subtle.importKey(
			"pkcs8",
			arrayBuffer,
			{
				name: "RSA-OAEP",
				hash: { name: "SHA-256" },
			},
			true,
			["decrypt"]
		);
	} else {
		throw new Error("Invalid key type");
	}
}

export async function generateAndStoreKeys() {
	try {
		const db = await initDB("RSAKeys");

		// Generate key pair using Web Crypto API
		const keyPair = await window.crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: "SHA-256",
			},
			true, // extractable
			["encrypt", "decrypt"]
		);

		// Export keys to PEM format
		const publicKeyPEM = await exportKeyToPEM(keyPair.publicKey, "public");
		const privateKeyPEM = await exportKeyToPEM(keyPair.privateKey, "private");

		const tx = db.transaction("keys", "readwrite");
		const store = tx.objectStore("keys");

		// Store the PEM strings
		await Promise.all([
			store.put(publicKeyPEM, "publicKey"),
			store.put(privateKeyPEM, "privateKey"),
		]);

		await tx.done;
		return { publicKey: publicKeyPEM, privateKey: privateKeyPEM };
	} catch (error) {
		console.error("Error generating and storing keys:", error);
		throw error;
	}
}

export async function getStoredKeys() {
	try {
		const db = await initDB("RSAKeys");
		const tx = db.transaction("keys", "readonly");
		const store = tx.objectStore("keys");

		// Helper function to wrap get request in a Promise
		const getKey = (keyName) => {
			return new Promise((resolve, reject) => {
				const request = store.get(keyName);
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
		};

		// Retrieve the PEM strings
		const [publicKeyPEM, privateKeyPEM] = await Promise.all([
			getKey("publicKey"),
			getKey("privateKey"),
		]);

		await tx.complete;

		if (!publicKeyPEM || !privateKeyPEM) {
			console.error("PEM keys not found in IndexedDB.");
			return null;
		}

		return { publicKey: publicKeyPEM, privateKey: privateKeyPEM };
	} catch (error) {
		console.error("Error getting stored keys:", error);
		return null;
	}
}

export async function encrypt(data, publicKey) {
	const publicKeyObj = await importPEMKey(publicKey, "public");
	const encoder = new TextEncoder();
	const encodedData = encoder.encode(data);
	const encrypted = await window.crypto.subtle.encrypt(
		{
			name: "RSA-OAEP",
		},
		publicKeyObj,
		encodedData
	);
	return arrayBufferToBase64(encrypted);
}

export async function decrypt(encryptedData, privateKey) {
	try {
		if (!encryptedData || !privateKey) {
			throw new Error("Missing required parameters");
		}

		console.log("Encrypted data length:", encryptedData.length);

		// Clean the encrypted data
		encryptedData = encryptedData.trim();

		// Validate base64 input with a more permissive regex
		if (!/^[A-Za-z0-9+/=]+$/.test(encryptedData)) {
			throw new Error("Invalid base64 format");
		}

		const privateKeyObj = await importPEMKey(privateKey, "private");
		console.log("Private key imported successfully", privateKeyObj);

		const buffer = base64ToArrayBuffer(encryptedData);
		console.log("Buffer length:", buffer);

		if (buffer.byteLength === 0) {
			throw new Error("Empty data buffer");
		}

		if (buffer.byteLength > 256) {
			throw new Error("Data too large for RSA-OAEP decryption");
		}

		const decrypted = await window.crypto.subtle.decrypt(
			{
				name: "RSA-OAEP",
			},
			privateKeyObj,
			buffer
		);

		const decoder = new TextDecoder();
		const decodedText = decoder.decode(decrypted);

		return {
			content: decodedText,
			timestamp: new Date().toISOString(),
			type: "received",
		};
	} catch (error) {
		console.error("Detailed decryption error:", {
			message: error.message,
			name: error.name,
			encryptedDataLength: encryptedData?.length,
			stack: error.stack,
		});
		throw new Error(`Decryption failed: ${error.name} - ${error.message}`);
	}
}
