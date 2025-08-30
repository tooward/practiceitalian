// verbs.js – JSON read/write

const fs = require('fs');
const path = require('path');

const verbsFile = path.resolve(__dirname, 'verbs.json');

function load() {
  const raw = fs.readFileSync(verbsFile, 'utf8');
  return JSON.parse(raw);
}

function save(verbs) {
  fs.writeFileSync(verbsFile, JSON.stringify(verbs, null, 2), 'utf8');
}

module.exports = { load, save };