import { BASE_STATS, ELEMENTS, StatName } from "./constants.ts";

export const limit = function (x: number, low: number, high: number) {
	return Math.max(low, Math.min(x, high));
};

export const roundPrecision = function (x: number, precision: number) {
	return Math.round(x * 10 ** precision) / 10 ** precision;
};

export const isStatName = (name: string): name is StatName => {
	return ([...BASE_STATS, ...ELEMENTS] as readonly string[]).includes(name);
};
