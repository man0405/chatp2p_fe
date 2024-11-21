import axiosClient from "@/lib/axios/axiosClient";

export const verifyEmail = async (email) => {
  try {
    const response = await axiosClient.get("/auth/verifyEmail?", {
      params: {
        email: email,
      },
    });
    return response;
  } catch (error) {
    throw error.response;
  }
};

export const signup = async (
	email,
	password,
	phone,
	firstName,
	lastName,
	publicKey
) => {
	try {
		const response = await axiosClient.post("/auth/signup", {
			email,
			password,
			phone,
			firstName,
			lastName,
			publicKey,
		});
		return response;
	} catch (error) {
		throw error.response;
	}
};

export const verifyCode = async (email, verificationCode) => {
	try {
		const response = await axiosClient.post("/auth/verify", {
			email,
			verificationCode,
		});
		return response;
	} catch (error) {
		throw error.response;
	}
};
