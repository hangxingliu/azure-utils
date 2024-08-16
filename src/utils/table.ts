export function printTable(headers: string[], rows: string[][]) {
  const width = headers.map((it) => it.length);
  for (const row of rows) {
    const cols = Math.min(row.length, headers.length);
    for (let i = 0; i < cols; i++) {
      const thisWidth = row[i].length;
      if (thisWidth > width[i]) width[i] = thisWidth;
    }
  }

  console.log(headers.map((it, i) => it.padEnd(width[i])).join("   "));
  console.log(headers.map((it, i) => "".padEnd(width[i], "-")).join("---"));
  for (const row of rows) console.log(row.map((it, i) => it.padEnd(width[i])).join("   "));
}
