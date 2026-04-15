const fs = require("fs");
const DIR = "./data";
const PATH = "./data/channels.json";

function load() {
  try {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
    if (!fs.existsSync(PATH)) return new Map();
    const json = JSON.parse(fs.readFileSync(PATH, "utf-8"));
    return new Map(Object.entries(json));
  } catch {
    return new Map();
  }
}

function save(map) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
  fs.writeFileSync(PATH, JSON.stringify(Object.fromEntries(map)), "utf-8");
}

module.exports = { load, save };