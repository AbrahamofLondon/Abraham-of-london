#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const contract = JSON.parse(readFileSync("data/ProductAuthorityContract.json", "utf-8"));

const by_state = {};
Object.entries(contract).forEach(([code, data]) => {
  const state = data.currentAuthorityState;
  if (!by_state[state]) by_state[state] = [];
  by_state[state].push(code);
});

console.log("ALL 43 PRODUCTS BY AUTHORITY STATE\n");
Object.entries(by_state)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([state, codes]) => {
    console.log(`${state}: ${codes.length}`);
    codes.slice(0, 5).forEach((code) => console.log(`  - ${code}`));
    if (codes.length > 5) console.log(`  ... and ${codes.length - 5} more`);
    console.log();
  });

writeFileSync("reports/product-state-distribution.json", JSON.stringify(by_state, null, 2));
