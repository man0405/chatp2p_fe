import axiosClient from "@/lib/axios/axiosClient";

export const changePassword = async (email, password, newPassword) => {
	try {
		const response = await axiosClient.post("/auth/changePassword", {
			email,
			password,
			newPassword,
		});
		return response;
	} catch (error) {
		throw error.response;
	}
};
