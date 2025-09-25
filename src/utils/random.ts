export function generateRandomUUID() {
	return crypto.randomUUID();
}

export function getRandomElementInArray<TArrayElement>(
	arr: ReadonlyArray<TArrayElement>,
): TArrayElement {
	// biome-ignore lint/style/noNonNullAssertion: <this is valid>
	return arr[Math.floor(Math.random() * (arr.length - 1))]!;
}
