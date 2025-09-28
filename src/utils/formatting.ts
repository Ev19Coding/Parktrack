export function approximateNumberToDecimalPlaces(
	number: number,
	decimalPlaces = 0,
) {
	if (decimalPlaces < 0) decimalPlaces = 0;

	const mod = 10 ** decimalPlaces;

	return Math.round(number * mod) / mod;
}
