const getToken = () => {
	return localStorage.getItem("token");
};

const setToken = (token) => {
	localStorage.setItem("token", token);
};

const removeToken = () => {
	localStorage.removeItem("token");
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
	getToken,
	setToken,
	removeToken,
};
