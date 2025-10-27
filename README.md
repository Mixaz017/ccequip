# CCEquip
CLI tool for finding ideal equipment in CrossCode

## Usage
`deno task main [options]`

Equipment items are scored and sorted based on their weighted stat totals.

## Options
`-l`, `--level <level>`: Set level for ascended equipment [default: 85]

`-w`, `--weight <weight>`: Set weight for a specific stat/modifier, can be set multiple times

`-t`, `--type <type>`: Filter equipment items by type, can be set multiple times [possible values: head, arm, torso, feet]

`-n`, `--top <number>`: Only show specified number of items

`--list-modifiers`: List known modifier names

### Weight specifier
Specify a stat name, element name, or internal modifier name, then its weight, separated by a colon. If `fallback` is used or no stat name is specified, sets the fallback weight for all stats.

Examples:
```sh
deno task main -w hp:-1 -w focus:2 # Prefer lower max HP, prioritize focus over other stats
deno task main -w 0 -w wave:1 # Ignore everything except wave resistance
deno task main -w assault:5 -w melee_dmg:5 # Internal modifier names
deno task main -w=-1 # When setting negative fallback weight, using `-w -1` won't work as the `-1` gets interpreted as its own flag. Use `=` sign to avoid this.
```

## Scoring
Each stat is multiplied by its weight and added up to calculate the final score. Most stats have weight of 1 by default.
- Base stats: max HP is calculated with a 0.1x multiplier due to its nature. Otherwise, they are calculated as-is, 1 stat = 1 score.
- Element resistances: 1% = 1 score by default.
- Modifiers: 1% = 1 score by default. Non-percent based modifiers are treated as +1 = 100%.
  - Modifiers that don't affect combat have a weight of 0 by default, even when setting a custom fallback weight.
    - These are: Botanist (`rank_plants`), Keeper (`money_plus`), Lucky Lucky (`drop_chance`), Trainer (`xp_plus`), and Zero XP (`xp_zero`).

## Generating item data
`data/equip.json` file is generated from the CrossCode's internal data. This file can be updated using `deno task datagen <path_to_your_crosscode_directory>`.
