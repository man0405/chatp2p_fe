export const debounce = (mainFunction, delay) => {
	let timer;
	return function (...args) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			mainFunction(...args);
		}, delay);
	};
};
