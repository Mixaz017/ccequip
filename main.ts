import { parseArgs } from "@std/cli/parse-args";
import { BASE_STATS, ELEMENTS, SCALING_TABLE } from "./lib/constants.ts";
import { parseDatabase } from "./lib/equiplist.ts";
import { limit, roundPrecision } from "./lib/utils.ts";

if (import.meta.main) {
	type Stats = (typeof BASE_STATS)[number] | (typeof ELEMENTS)[number];
	type WeightMapping = {
		stat: Partial<Record<Stats, number>>;
		modifier: Record<string, number>;
		fallback: number;
	};

	const isStat = (name: string): name is Stats => {
		return ([...BASE_STATS, ...ELEMENTS] as readonly string[]).includes(name);
	};

	const equiplist = parseDatabase({
		items: JSON.parse(Deno.readTextFileSync("./data/equip.json")),
	}).items;

	const flags = parseArgs(Deno.args, {
		collect: ["type", "weight"],
		default: { level: 85, type: ["head", "arm", "torso", "feet"] },
		boolean: ["list-modifiers", "unobtainable"],
		string: ["type", "weight"],
		alias: { w: "weight", t: "type", l: "level", n: "top", u: "unobtainable" },
	});
	if (typeof flags.level !== "number") {
		console.error(`${flags.level} is not a valid level.`);
		Deno.exit(1);
	} else if (flags.level < 1 || flags.level > 99) {
		console.error(
			`${flags.level} is outside of the normal level range, it must be between 1 to 99 inclusive.`,
		);
		Deno.exit(1);
	}

	const modifiers = Array.from(equiplist.reduce((modifiers, equip) => {
		Object.keys(equip.properties).forEach((modifier) =>
			modifiers.add(modifier.toLowerCase())
		);
		return modifiers;
	}, new Set() as Set<string>)).sort();

	if (flags["list-modifiers"]) {
		console.log(`Known modifiers: ${modifiers.join(", ")}`);
		Deno.exit(0);
	}

	// Parse weight args
	const userWeight: WeightMapping = flags.weight.reduce(
		(weights, weightStr) => {
			const match = /(?:(\w+)\s*:\s*)?(-?(?:\d*\.)?\d+)/.exec(weightStr);
			if (match !== null) {
				const statName = match[1]?.toLowerCase() ?? "fallback";
				const weight = parseFloat(match[2]);

				if (isStat(statName)) {
					weights.stat[statName] = weight;
				} else if (modifiers.includes(statName)) {
					weights.modifier[statName] = weight;
				} else if (statName === "fallback") weights.fallback = weight;
				else {
					console.error(`Unknown stat/modifier "${statName}", exiting`);
					Deno.exit(1);
				}
			} else {
				console.error(`Invalid weight specifier "${weightStr}"`);
				Deno.exit(1);
			}
			return weights;
		},
		{
			// Default weights
			stat: {},
			modifier: {
				rank_plants: 0,
				money_plus: 0,
				drop_chance: 0,
				xp_plus: 0,
				xp_zero: 0,
			},
			fallback: 1,
		} as WeightMapping,
	);
	const filtered = equiplist.filter((equip) =>
		flags.type.includes(equip.equipType.toLowerCase()) &&
		(flags.unobtainable || !equip.name.en_US?.startsWith("-"))
	);

	const scoreEquip = function (
		equip: (typeof equiplist)[number],
		weightMap: WeightMapping,
		scaleLevel?: number,
	) {
		const score = {
			total: 0,
			weighted: {} as Record<string, number>,
		};

		const scoreStat = function (
			stat: number,
			weight: number | undefined,
			name: string,
		) {
			const weightedStat = (stat ?? 0) * (weight ?? weightMap.fallback);
			if (weightedStat !== 0) {
				score.weighted[name] = weightedStat;
				score.total += weightedStat;
			}
		};

		const getAverageStat = function (level: number, statType: "base" | "hp") {
			const scaleIndex = SCALING_TABLE.findIndex((scale) =>
				scale.level >= level
			);
			if (scaleIndex === -1) return 1;
			const scaling = SCALING_TABLE[scaleIndex];
			if (scaling.level === scaleLevel) return scaling[statType];
			const scalingHigh = SCALING_TABLE[scaleIndex + 1];
			return scaling[statType] +
				(scalingHigh[statType] - scaling[statType]) *
					((level - scaling.level) / (scalingHigh.level - scaling.level));
		};

		const getFactor = function (
			baseLevel: number,
			scaleLevel: number,
			factorType: "base" | "hp",
		) {
			return getAverageStat(scaleLevel, factorType) /
				getAverageStat(baseLevel, factorType);
		};

		if (scaleLevel && equip.isScalable) {
			const baseFactor = getFactor(equip.level, scaleLevel, "base");
			const hpFactor = getFactor(equip.level, scaleLevel, "hp");
			if (equip.params.hp) {
				equip.params.hp = Math.max(1, Math.round(equip.params.hp * hpFactor));
			}
			if (equip.params.attack) {
				equip.params.attack = limit(
					Math.round(equip.params.attack * baseFactor),
					0,
					999,
				);
			}
			if (equip.params.defense) {
				equip.params.defense = limit(
					Math.round(equip.params.defense * baseFactor),
					0,
					999,
				);
			}
			if (equip.params.focus) {
				equip.params.focus = limit(
					Math.round(equip.params.focus * baseFactor),
					0,
					999,
				);
			}
		}

		scoreStat((equip.params.hp ?? 0) * 0.1, weightMap.stat.hp, "hp");
		scoreStat(equip.params.attack ?? 0, weightMap.stat.attack, "attack");
		scoreStat(equip.params.defense ?? 0, weightMap.stat.defense, "defense");
		scoreStat(equip.params.focus ?? 0, weightMap.stat.focus, "focus");

		ELEMENTS.forEach((element, index) =>
			scoreStat(
				(equip.params.elemFactor[index] - 1) * 100,
				weightMap.stat[element],
				element,
			)
		);

		for (const modName in equip.properties) {
			scoreStat(
				((equip.properties as Record<string, number>)[modName] - 1) * 100,
				weightMap.modifier[modName.toLowerCase()],
				modName.toLowerCase(),
			);
		}
		return score;
	};

	console.table(
		filtered.map((equip) => {
			return {
				data: equip,
				score: scoreEquip(equip, userWeight, flags.level as number),
			};
		}).sort((a, b) => b.score.total - a.score.total).slice(
			0,
			typeof flags.top === "number" ? flags.top : filtered.length,
		).map((equip) => {
			return {
				score: roundPrecision(equip.score.total, 3),
				name: equip.data.name.en_US ?? `(Item ID ${equip.data.order})`,
				breakdown: Object.entries(equip.score.weighted).map((
					[statName, score],
				) => `${statName}: ${roundPrecision(score, 3)}`).join(", "),
			};
		}),
	);
}
