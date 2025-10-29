import { parseArgs } from "@std/cli/parse-args";
import equiplist from "./data/equip.json" with { type: "json" };
import { BASE_STATS, ELEMENTS } from "./constants.ts";

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
	const flags = parseArgs(Deno.args, {
		collect: ["type", "weight"],
		default: { level: 85, type: ["head", "arm", "torso", "feet"] },
		boolean: ["list-modifiers", "unobtainable"],
		string: ["type", "weight"],
		alias: { w: "weight", t: "type", l: "level", n: "top", u: "unobtainable" },
	});

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
		(flags.unobtainable || !equip.name.en_US.startsWith("-"))
	);

	const scoreEquip = function (
		equip: (typeof equiplist)[number],
		weightMap: WeightMapping,
	) {
		return (equip.params.hp ?? 0) * 0.1 *
				(weightMap.stat.hp ?? weightMap.fallback) +
			(equip.params.attack ?? 0) *
				(weightMap.stat.attack ?? weightMap.fallback) +
			(equip.params.defense ?? 0) *
				(weightMap.stat.defense ?? weightMap.fallback) +
			(equip.params.focus ?? 0) *
				(weightMap.stat.focus ?? weightMap.fallback) +
			ELEMENTS.reduce(
					(score, element, index) =>
						score +
						(equip.params.elemFactor[index] - 1) *
							(weightMap.stat[element] ?? weightMap.fallback),
					0,
				) * 100 +
			Object.entries(equip.properties).reduce(
					(score, [modName, modValue]) =>
						score +
						(modValue - 1) *
							(weightMap.modifier[modName.toLowerCase()] ??
								weightMap.fallback),
					0,
				) * 100;
	};

	console.table(
		filtered.map((equip) => {
			return { data: equip, score: scoreEquip(equip, userWeight) };
		}).sort((a, b) => b.score - a.score).slice(
			0,
			typeof flags.top === "number" ? flags.top : filtered.length,
		).map((equip) => {
			return {
				score: Math.round(equip.score * 1e3) / 1e3,
				name: equip.data.name.en_US,
			};
		}),
	);
}
