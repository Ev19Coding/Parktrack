export function generateRandomUUID() {
	return crypto.randomUUID();
}

export function getRandomElementInArray<TArrayElement>(
	arr: ReadonlyArray<TArrayElement>,
): TArrayElement | undefined {
	if (arr.length === 0) {
		return undefined;
	}

	const index = Math.floor(Math.random() * arr.length);

	return arr[index];
}
