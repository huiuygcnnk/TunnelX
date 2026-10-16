import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const appRoot = path.join(projectRoot, "bqc24_launcher_bundle", "bqc24", "lilicraftzone");

const copies = [
  ["@mercuryworkshop/scramjet/dist/scramjet.bundle.js", "scram/scramjet.bundle.js"],
  ["@mercuryworkshop/scramjet/dist/scramjet.all.js", "scram/scramjet.all.js"],
  ["@mercuryworkshop/scramjet/dist/scramjet.sync.js", "scram/scramjet.sync.js"],
  ["@mercuryworkshop/scramjet/dist/scramjet.wasm.wasm", "scram/scramjet.wasm.wasm"],
  ["@mercuryworkshop/bare-mux/dist/worker.js", "baremux/worker.js"],
  ["@mercuryworkshop/epoxy-transport/dist/index.mjs", "epoxy/index.mjs"],
  ["@mercuryworkshop/libcurl-transport/dist/index.mjs", "libcurl/index.mjs"],
];

for (const [source, destination] of copies) {
  const target = path.join(appRoot, destination);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(projectRoot, "node_modules", source), target);
}

const appScript = path.join(
  projectRoot,
  "bqc24_launcher_bundle",
  "bqc24",
  "js",
  "index-kBew-BnP.4d288.js",
);
let script = await readFile(appScript, "utf8");
const discoveryStart =
  "async function k(){await fetch(`https://cdn.jsdelivr.net/gh/ginrummyonline/toythat@latest/my-synapse.js`).then(e=>e.json());";
const discoveryEnd = "function ce(){";
const startIndex = script.indexOf(discoveryStart);
const endIndex = script.indexOf(discoveryEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  script =
    script.slice(0, startIndex) +
    "async function k(){return null}" +
    script.slice(endIndex);
} else if (!script.includes("async function k(){return null}function ce(){")) {
  throw new Error("Could not locate the bundled remote Wisp discovery code.");
}

script = script.replace("src:`./bqc24-logo.png`", "src:`../images/bqc24-logo.svg`");
script = script.replace("src:`./bqc24-logo.svg`", "src:`../images/bqc24-logo.svg`");
script = script.replace("e.href=`./bqc24.ico`", "e.href=`../images/bqc24.e3dd7.ico`");
script = script.replace("ws://localhost:8081/wisp/", "ws://127.0.0.1:8081/wisp/");
await writeFile(appScript, script);
