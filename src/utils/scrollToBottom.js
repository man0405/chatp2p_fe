export const scrollToBottom = (container, smooth = false) => {
	if (container?.children.length) {
		const lastElement = container?.lastChild;

		lastElement?.scrollIntoView({
			behavior: smooth ? "smooth" : "auto",
			block: "end",
			inline: "nearest",
		});
	}
};
