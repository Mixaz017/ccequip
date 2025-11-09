import * as v from "@valibot/valibot";

// Translated properties are intentionally checked loosely to allow custom items.
// Everything else must be as strict as the official item database.
const EquipItemSchema = v.object({
	order: v.number(),
	name: v.objectWithRest({
		langUid: v.number(),
		...v.partial(v.object({
			en_US: v.string(),
			de_DE: v.string(),
			fr_FR: v.string(),
			zh_CN: v.string(),
			zh_TW: v.string(),
			ja_JP: v.string(),
			ko_KR: v.string(),
		})).entries,
	}, v.string()),
	description: v.objectWithRest({
		langUid: v.number(),
		...v.partial(v.object({
			en_US: v.string(),
			de_DE: v.string(),
			fr_FR: v.string(),
			zh_CN: v.string(),
			zh_TW: v.string(),
			ja_JP: v.string(),
			ko_KR: v.string(),
		})).entries,
	}, v.string()),
	type: v.pipe(v.string(), v.value("EQUIP")),
	rarity: v.number(),
	level: v.number(),
	icon: v.string(),
	noTrack: v.exactOptional(v.boolean()),
	noCount: v.exactOptional(v.boolean()),
	isScalable: v.exactOptional(v.boolean()),
	effect: v.object({
		sheet: v.string(),
		name: v.nullable(v.string()),
	}),
	cost: v.number(),
	equipType: v.string(),
	params: v.object({
		elemFactor: v.tuple([v.number(), v.number(), v.number(), v.number()]),
		...v.partial(v.object({
			hp: v.number(),
			attack: v.number(),
			defense: v.number(),
			focus: v.number(),
		})).entries,
	}),
	properties: v.record(v.string(), v.number()),
});

const EquipDbSchema = v.object({
	items: v.pipe(
		v.array(v.looseObject({ type: v.string() })),
		v.filterItems((item) => item.type === "EQUIP"),
		v.array(EquipItemSchema),
	),
});

export type EquipItem = v.InferOutput<typeof EquipItemSchema>;
export type EquipDb = v.InferOutput<typeof EquipDbSchema>;

/**
 * Parse objects formatted like assets/data/item-database.json, filtering out non-equip items.
 */
export const parseDatabase = function (database: unknown): EquipDb {
	return v.parse(EquipDbSchema, database);
};

export const getKnownModifiers = function (db: EquipDb) {
	const modifiers = new Set() as Set<string>;
	db.items.forEach((item) =>
		Object.keys(item.properties).forEach((modifierName) =>
			modifiers.add(modifierName)
		)
	);
	return Array.from(modifiers).sort();
};
