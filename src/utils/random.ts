export function generateRandomUUID() {
	return crypto.randomUUID();
}

export function getRandomElementInArray<TArrayElement>(
	arr: ReadonlyArray<TArrayElement>,
): TArrayElement | undefined {
	try {
		if (arr.length === 0) {
			throw new Error("cannot pick from an empty array");
		}
		const index = Math.floor(Math.random() * arr.length);

		return arr[index];
	} catch {
		return undefined;
	}
}
