import { parseArgs } from "@std/cli/parse-args";
import { getKnownModifiers, parseDatabase } from "./lib/equiplist.ts";
import { scoreEquip, WeightMapping } from "./lib/score.ts";
import { isStatName, roundPrecision } from "./lib/utils.ts";

if (import.meta.main) {
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

	const modifiers = getKnownModifiers({ items: equiplist }).map(
		(modifierName) => modifierName.toLowerCase(),
	);

	if (flags["list-modifiers"]) {
		console.log(`Known modifiers: ${modifiers.join(", ")}`);
		Deno.exit(0);
	}

	// Parse weight args
	const userWeight = flags.weight.reduce(
		(weights, weightStr) => {
			const match = /(?:(\w+)\s*:\s*)?(-?(?:\d*\.)?\d+)/.exec(weightStr);
			if (match !== null) {
				const statName = match[1]?.toLowerCase() ?? "fallback";
				const weight = parseFloat(match[2]);

				if (isStatName(statName)) {
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
