import * as v from "@valibot/valibot";

const EquipSchema = v.object({
	items: v.pipe(
		v.array(v.looseObject({ type: v.string() })),
		v.filterItems((item) => item.type === "EQUIP"),
		v.array(v.object({
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
		})),
	),
});

export const parseDatabase = function (database: unknown) {
	return v.parse(EquipSchema, database);
};
