export const getToken = () => {
	return localStorage.getItem("token");
};

export const setToken = (token) => {
	console.log("setToken ~ token:", token);

	localStorage.setItem("token", token);
};

export const removeToken = () => {
	localStorage.removeItem("token");
};
