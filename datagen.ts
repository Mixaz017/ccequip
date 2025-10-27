import { join } from "@std/path";

const gamePath = Deno.args[0];
if (!gamePath) {
	console.error("No path specified");
	Deno.exit(1);
}

type Item = {
	type: string;
};

const items: Item[] = JSON.parse(
	Deno.readTextFileSync(join(gamePath, "assets", "data", "item-database.json")),
).items;
Deno.writeTextFileSync(
	join(Deno.cwd(), "data", "equip.json"),
	JSON.stringify(items.filter((item) => item.type === "EQUIP")),
);
