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
	const binary = window.atob(base64);
	const bytes = new Uint8Array(binary.length);
	Array.from(binary).forEach((char, i) => {
		bytes[i] = char.charCodeAt(0);
	});
	return bytes.buffer;
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

		// Retrieve the PEM strings
		const [publicKeyPEM, privateKeyPEM] = await Promise.all([
			store.get("publicKey"),
			store.get("privateKey"),
		]);

		await tx.complete;

		if (!publicKeyPEM || !privateKeyPEM) return null;

		// Import the keys back into CryptoKey objects
		const publicKey = await importPEMKey(publicKeyPEM, "public");
		const privateKey = await importPEMKey(privateKeyPEM, "private");

		return { publicKey, privateKey };
	} catch (error) {
		console.error("Error getting stored keys:", error);
		return null;
	}
}

export async function encrypt(data, publicKey) {
	const encoder = new TextEncoder();
	const encodedData = encoder.encode(data);
	const encrypted = await window.crypto.subtle.encrypt(
		{
			name: "RSA-OAEP",
		},
		publicKey,
		encodedData
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
	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}
