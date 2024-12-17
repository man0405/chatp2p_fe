import React from "react";
import * as LucideIcons from "lucide-react";

const IconLoader = ({ name, ...props }) => {
	const IconComponent = LucideIcons[name];

	if (!IconComponent) {
		// Fallback icon if the specified icon name doesn't exist
		return <LucideIcons.HelpCircle {...props} />;
	}

	return <IconComponent {...props} />;
};

export default IconLoader;
