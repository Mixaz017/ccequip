import { ELEMENTS, SCALING_TABLE, StatName } from "./constants.ts";
import { EquipItem } from "./equiplist.ts";
import { limit } from "./utils.ts";

export type WeightMapping = {
	stat: Partial<Record<StatName, number>>;
	modifier: Record<string, number>;
	fallback: number;
};

export const scoreEquip = function (
	equip: EquipItem,
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
		const scaleIndex = SCALING_TABLE.findIndex((scale) => scale.level >= level);
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

	// Adjust stats of ascended items
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
			(equip.properties[modName] - 1) * 100,
			weightMap.modifier[modName.toLowerCase()],
			modName.toLowerCase(),
		);
	}
	return score;
};
