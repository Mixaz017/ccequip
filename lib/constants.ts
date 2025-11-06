export const BASE_STATS = ["hp", "attack", "defense", "focus"] as const;
export const ELEMENTS = ["heat", "cold", "shock", "wave"] as const;
// Directly taken from game.compiled.js
export const SCALING_TABLE = [
	{ level: 1, base: 20, hp: 205 },
	{ level: 6, base: 23, hp: 234 },
	{ level: 11, base: 26, hp: 266 },
	{ level: 16, base: 30, hp: 303 },
	{ level: 21, base: 34, hp: 343 },
	{ level: 26, base: 38, hp: 389 },
	{ level: 31, base: 43, hp: 439 },
	{ level: 36, base: 49, hp: 496 },
	{ level: 41, base: 56, hp: 560 },
	{ level: 46, base: 63, hp: 630 },
	{ level: 51, base: 71, hp: 710 },
	{ level: 56, base: 79, hp: 798 },
	{ level: 61, base: 89, hp: 897 },
	{ level: 66, base: 100, hp: 1008 },
	{ level: 71, base: 113, hp: 1132 },
	{ level: 76, base: 127, hp: 1270 },
	{ level: 81, base: 142, hp: 1425 },
	{ level: 86, base: 159, hp: 1598 },
	{ level: 91, base: 179, hp: 1792 },
	{ level: 96, base: 200, hp: 2008 },
	{ level: 99, base: 215, hp: 2150 },
];
