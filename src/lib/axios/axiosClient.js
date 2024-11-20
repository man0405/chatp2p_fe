import axios from "axios";
import qs from "qs";
import { getToken } from "@/services/token.service";

const axiosClient = axios.create({
	baseURL: process.env.SERVER_URL,
	headers: {
		"Content-Type": "application/json",
		// "content-type": "multipart/form-data",
	},
	paramsSerializer: {
		serialize: (params) => {
			return qs.stringify(params, { arrayFormat: "repeat", allowDots: true });
		},
	},
});
axios.interceptors.request.use(
	(config) => {
		const token = getToken();
		if (token) {
			config.headers["Authorization"] = "Bearer " + token;
		}
		// config.headers['Content-Type'] = 'application/json';
		return config;
	},
	(error) => {
		Promise.reject(error);
	}
);
axiosClient.interceptors.response.use(
	(response) => {
		if (response && response.data) {
			return response.data;
		}

		return response;
	},
	(error) => {
		console.error(error.response.data);
	}
);

export default axiosClient;
