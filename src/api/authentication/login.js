import axiosClient from "@/lib/axios/axiosClient";

export const login = async (email, password) => {
	try {
		const response = await axiosClient.post("/auth/signin", {
			email,
			password,
		});
		return response;
	} catch (error) {
		throw error.response;
	}
};
