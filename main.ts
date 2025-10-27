import { parseArgs } from "@std/cli/parse-args";
import equiplist from "./data/equips.json" with { type: "json" };
import { BASE_STATS, ELEMENTS } from "./constants.ts";

if (import.meta.main) {
	const flags = parseArgs(Deno.args, {
		collect: ["type", "weight"],
		default: { level: 85, type: ["head", "arm", "torso", "feet"] },
		boolean: ["list-modifiers"],
		string: ["type", "weight"],
		alias: { w: "weight", t: "type", l: "level", n: "top" },
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
	const userWeight = flags.weight.reduce((weights, weightStr) => {
		const match = /(?:(\w+)\s*:\s*)?(-?(?:\d*\.)?\d+)/.exec(weightStr);
		if (match !== null) {
			const statName = match[1]?.toLowerCase() ?? "fallback";
			const weight = parseFloat(match[2]);
			if (BASE_STATS.concat(ELEMENTS).includes(statName)) {
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
	}, {
		// Default weights
		stat: {} as Record<string, number>,
		modifier: {
			rank_plants: 0,
			money_plus: 0,
			drop_chance: 0,
			xp_plus: 0,
			xp_zero: 0,
		} as Record<string, number>,
		fallback: 1,
	});
	console.log(userWeight);
	const filtered = equiplist.filter((equip) =>
		flags.type.includes(equip.equipType.toLowerCase())
	);

	const scoreEquip = function (equip: (typeof equiplist)[number]) {
		return (equip.params.hp ?? 0) * 0.1 *
				(userWeight.stat.hp ?? userWeight.fallback) +
			(equip.params.attack ?? 0) *
				(userWeight.stat.defence ?? userWeight.fallback) +
			(equip.params.defense ?? 0) *
				(userWeight.stat.defense ?? userWeight.fallback) +
			(equip.params.focus ?? 0) *
				(userWeight.stat.focus ?? userWeight.fallback) +
			ELEMENTS.reduce(
					(score, element, index) =>
						score +
						(equip.params.elemFactor[index] - 1) *
							(userWeight.stat[element] ?? userWeight.fallback),
					0,
				) * 100 +
			Object.entries(equip.properties).reduce(
					(score, [modName, modValue]) =>
						score +
						(modValue - 1) *
							(userWeight.modifier[modName.toLowerCase()] ??
								userWeight.fallback),
					0,
				) * 100;
	};

	console.table(
		filtered.map((equip) => {
			return { data: equip, score: scoreEquip(equip) };
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
