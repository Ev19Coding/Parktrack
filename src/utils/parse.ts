function tryParse(data: string) {
	try {
		return JSON.parse(data);
	} catch {
		return data;
	}
}

/** Just to ensure that we are dealing with valid js objects, not any stringified variants */
export function tryParseObject(data: Record<string, unknown>) {
	let key: keyof typeof data;

	for (key in data) {
		const value = data[key];

		// Ensure we have a valid js value
		data[key] = typeof value === "string" ? tryParse(value) : value;
	}

	return data;
}
