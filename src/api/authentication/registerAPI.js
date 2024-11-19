import axiosClient from "@/lib/axios/axiosClient";

export const verifyEmail = async (email) => {
	try {
		const response = await axiosClient.get("/auth/verifyEmail", {
			params: {
				email: email,
			},
		});
		return response;
	} catch (error) {
		throw error.response;
	}
};
