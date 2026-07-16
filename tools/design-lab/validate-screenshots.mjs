import { readFile, stat } from "node:fs/promises";

const captures = [
  ["reports/phase-0/screenshots/legacy/legacy-1440x900.jpg", 1440, 900],
  ["reports/phase-0/screenshots/legacy/legacy-768x1024.jpg", 768, 1024],
  ["reports/phase-0/screenshots/legacy/legacy-390x844.jpg", 390, 844],
  ["reports/phase-0/screenshots/prototypes/prototype-1440x900.jpg", 1440, 900],
  ["reports/phase-0/screenshots/prototypes/prototype-768x1024.jpg", 768, 1024],
  ["reports/phase-0/screenshots/prototypes/prototype-390x844.jpg", 390, 844]
];

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    if (length < 2) return null;
    offset += length;
  }
  return null;
}

const failures = [];
for (const [file, targetWidth, targetHeight] of captures) {
  try {
    if ((await stat(file)).size < 1000) {
      failures.push(`${file}: empty`);
      continue;
    }
    const dimensions = readJpegDimensions(await readFile(file));
    if (!dimensions) {
      failures.push(`${file}: not a readable JPEG`);
      continue;
    }
    const { width, height } = dimensions;
    if (width > targetWidth || width < targetWidth - 32 || height > targetHeight || height < targetHeight - 64) {
      failures.push(`${file}: ${width}x${height} is inconsistent with requested ${targetWidth}x${targetHeight}`);
    }
  } catch {
    failures.push(`${file}: missing`);
  }
}
if (failures.length) throw new Error(`Screenshot validation failed:\n${failures.join("\n")}`);
process.stdout.write(`Screenshot smoke PASS (${captures.length} captures)\n`);
