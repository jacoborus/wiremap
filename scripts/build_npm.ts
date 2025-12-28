import { emptyDir } from "jsr:@std/fs/empty-dir";

const denoRaw = Deno.readTextFileSync("./deno.json");
const denojson = JSON.parse(denoRaw);

const pkg = {
  name: "wiremap",
  version: denojson.version,
  description: denojson.description,
  main: "./src/wiremap.js",
  repository: {
    type: "git",
    url: "git+https://github.com/jacoborus/wiremap.git",
  },
  type: "module",
  keywords: denojson.keywords,
  author: denojson.author,
  license: "MIT",
  bugs: {
    url: "https://github.com/jacoborus/wiremap/issues",
  },
  homepage: "https://github.com/jacoborus/wiremap#readme",
  exports: {
    ".": {
      import: "./src/wiremap.js",
      types: "./src/wiremap.d.ts",
    },
    "./package.json": "./package.json",
  },
};

await emptyDir("./npm");

Deno.writeTextFileSync("./npm/package.json", JSON.stringify(pkg, null, 2));
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");

const command = new Deno.Command("npx", {
  args: ["tsc", "-p", "tsconfig.json"],
});

await command.output();
