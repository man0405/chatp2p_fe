import { createSlice } from "@reduxjs/toolkit";

// private String fullName;
// private String email;
// private String publicKey;
const usersActive = createSlice({
	name: "usersActive",
	initialState: {
		users: [],
	},
	reducers: {
		setActiveUser: (state, action) => {
			state.users = action.payload;
		},
	},
});

export const usersActiveActions = usersActive.actions;
export default usersActive.reducer;
