/** Just to ensure that we are dealing with valid js objects, not any stringified variants */
export function tryParse(data: string) {
	try {
		return JSON.parse(data);
	} catch {
		return data;
	}
}
