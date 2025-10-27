import { join } from "@std/path";

const gamePath = Deno.args[0];
if (!gamePath) throw Error("No path specified");

type Item = {
  type: string;
};

const items: Item[] = JSON.parse(
  Deno.readTextFileSync(join(gamePath, "assets", "data", "item-database.json")),
).items;
Deno.writeTextFileSync(
  join(Deno.cwd(), "data", "equips.json"),
  JSON.stringify(items.filter((item) => item.type === "EQUIP")),
);
