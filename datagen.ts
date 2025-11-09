import { join } from "@std/path";
import { parseDatabase } from "./lib/equiplist.ts";

const gamePath = Deno.args[0];
if (!gamePath) {
	console.error("No path specified");
	Deno.exit(1);
}

const items = parseDatabase(
	JSON.parse(
		Deno.readTextFileSync(
			join(gamePath, "assets", "data", "item-database.json"),
		),
	),
).items;

Deno.writeTextFileSync(
	join(Deno.cwd(), "data", "equip.json"),
	JSON.stringify(items),
);
