import { configureStore } from "@reduxjs/toolkit";
import usersActive from "./activeUser";

export const makeStore = () => {
	return configureStore({
		reducer: {
			usersActive,
		},
	});
};
