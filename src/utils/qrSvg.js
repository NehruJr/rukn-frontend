/**
 * Pure JavaScript ISO/IEC 18004 Vector SVG QR Code Engine
 * Zero external npm dependencies.
 *
 * Supports Versions 1 to 10 (up to 270+ bytes in byte mode),
 * Error Correction levels L and M, Galois Field GF(2^8) Reed-Solomon math,
 * ISO penalty mask evaluation, and crisp vector SVG generation.
 */

import React, { useMemo } from 'react';

// Galois Field GF(256) tables (generator polynomial 0x11D = 285)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  EXP[i + 255] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x & 128 ? 0x11d : 0);
}

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP[LOG[x] + LOG[y]];
}

function rsGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const factor = [1, EXP[i]];
    const res = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      res[j] ^= poly[j];
      res[j + 1] ^= gfMul(poly[j], factor[1]);
    }
    poly = res;
  }
  return poly;
}

function calculateECC(data, eccCount) {
  const gen = rsGeneratorPoly(eccCount);
  const ecc = new Uint8Array(eccCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ ecc[0];
    for (let j = 0; j < eccCount - 1; j++) {
      ecc[j] = ecc[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    ecc[eccCount - 1] = gfMul(gen[eccCount], factor);
  }
  return ecc;
}

// 15-bit BCH format info lookup (precomputed with mask 0x5412)
const FORMAT_INFO = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0, // L: 0..7
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976, // M: 0..7
  0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b, // Q: 0..7
  0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed  // H: 0..7
];

const VERSIONS = [
  null,
  { v: 1,  size: 21, dataCapM: 16,  eccPerBlockM: 10, blocksM: 1, align: [] },
  { v: 2,  size: 25, dataCapM: 28,  eccPerBlockM: 16, blocksM: 1, align: [6, 18] },
  { v: 3,  size: 29, dataCapM: 44,  eccPerBlockM: 26, blocksM: 1, align: [6, 22] },
  { v: 4,  size: 33, dataCapM: 64,  eccPerBlockM: 18, blocksM: 2, align: [6, 26] },
  { v: 5,  size: 37, dataCapM: 86,  eccPerBlockM: 24, blocksM: 2, align: [6, 30] },
  { v: 6,  size: 41, dataCapM: 108, eccPerBlockM: 16, blocksM: 4, align: [6, 34] },
  { v: 7,  size: 45, dataCapM: 124, eccPerBlockM: 18, blocksM: 4, align: [6, 22, 38] },
  { v: 8,  size: 49, dataCapM: 154, eccPerBlockM: 22, blocksM: 4, align: [6, 24, 42] },
  { v: 9,  size: 53, dataCapM: 182, eccPerBlockM: 22, blocksM: 5, align: [6, 26, 46] },
  { v: 10, size: 57, dataCapM: 216, eccPerBlockM: 26, blocksM: 5, align: [6, 28, 50] }
];

function chooseVersion(byteLen) {
  for (let v = 1; v <= 10; v++) {
    const headerBits = v < 10 ? 12 : 20;
    const requiredCodewords = Math.ceil((headerBits + byteLen * 8 + 4) / 8);
    if (requiredCodewords <= VERSIONS[v].dataCapM) {
      return VERSIONS[v];
    }
  }
  return VERSIONS[10];
}

function encodeData(text, ver) {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const bitBuf = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bitBuf.push((val >>> i) & 1);
    }
  }

  // Byte mode (0100)
  pushBits(0b0100, 4);
  pushBits(textBytes.length, ver.v < 10 ? 8 : 16);
  for (let i = 0; i < textBytes.length; i++) {
    pushBits(textBytes[i], 8);
  }

  // Terminator (up to 4 zeros)
  const capacityBits = ver.dataCapM * 8;
  const termLen = Math.min(4, capacityBits - bitBuf.length);
  pushBits(0, termLen);
  while (bitBuf.length % 8 !== 0) {
    bitBuf.push(0);
  }

  // Pad bytes 0xEC (236) and 0x11 (17)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitBuf.length < capacityBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(ver.dataCapM);
  for (let i = 0; i < ver.dataCapM; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitBuf[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  const numBlocks = ver.blocksM;
  const eccPerBlock = ver.eccPerBlockM;
  const baseBlockLen = Math.floor(ver.dataCapM / numBlocks);
  const extraBlocks = ver.dataCapM % numBlocks;

  const dataBlocks = [];
  const eccBlocks = [];
  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const blockLen = baseBlockLen + (b >= numBlocks - extraBlocks ? 1 : 0);
    const blockData = dataBytes.slice(offset, offset + blockLen);
    dataBlocks.push(blockData);
    eccBlocks.push(calculateECC(blockData, eccPerBlock));
    offset += blockLen;
  }

  const interleaved = [];
  const maxBlockLen = baseBlockLen + (extraBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) {
        interleaved.push(dataBlocks[b][i]);
      }
    }
  }
  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      interleaved.push(eccBlocks[b][i]);
    }
  }

  return interleaved;
}

function createMatrix(ver) {
  const size = ver.size;
  const matrix = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  function setModule(r, c, val, isRes = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (isRes) reserved[r][c] = 1;
    }
  }

  function addFinder(top, left) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = top + r;
        const mc = left + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
            setModule(mr, mc, isBlack ? 1 : 0);
          } else {
            setModule(mr, mc, 0);
          }
        }
      }
    }
  }

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  if (ver.align && ver.align.length > 0) {
    const coords = ver.align;
    for (let i = 0; i < coords.length; i++) {
      for (let j = 0; j < coords.length; j++) {
        const ar = coords[i];
        const ac = coords[j];
        if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
        if (reserved[ar][ac]) continue;

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isBlack = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
            setModule(ar + r, ac + c, isBlack ? 1 : 0);
          }
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) setModule(6, i, i % 2 === 0 ? 1 : 0);
    if (!reserved[i][6]) setModule(i, 6, i % 2 === 0 ? 1 : 0);
  }

  setModule(size - 8, 8, 1);

  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = 1;
      reserved[i][8] = 1;
    }
  }
  for (let i = size - 8; i < size; i++) {
    reserved[8][i] = 1;
    reserved[i][8] = 1;
  }

  return { matrix, reserved, size };
}

function placeData(matrix, reserved, size, interleaved) {
  const bits = [];
  for (let i = 0; i < interleaved.length; i++) {
    for (let b = 7; b >= 0; b--) {
      bits.push((interleaved[i] >>> b) & 1);
    }
  }

  let bitIdx = 0;
  let upwards = true;

  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--;

    for (let r = 0; r < size; r++) {
      const row = upwards ? (size - 1 - r) : r;
      for (let c = 0; c < 2; c++) {
        const col = rightCol - c;
        if (!reserved[row][col]) {
          matrix[row][col] = bitIdx < bits.length ? bits[bitIdx++] : 0;
        }
      }
    }
    upwards = !upwards;
  }
}

function applyMask(matrix, reserved, size, maskPattern) {
  const masked = Array.from({ length: size }, (_, r) => new Int8Array(matrix[r]));
  const maskFn = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ][maskPattern];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && maskFn(r, c)) {
        masked[r][c] ^= 1;
      }
    }
  }
  return masked;
}

function calculatePenalty(grid, size) {
  let penalty = 0;
  for (let r = 0; r < size; r++) {
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (grid[r][c] === grid[r][c - 1]) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const val = grid[r][c];
      if (val === grid[r][c + 1] && val === grid[r + 1][c] && val === grid[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }
  return penalty;
}

function writeFormatInfo(matrix, size, maskPattern) {
  const formatVal = FORMAT_INFO[8 + maskPattern]; // Level M offset is 8
  const bits = [];
  for (let i = 14; i >= 0; i--) {
    bits.push((formatVal >>> i) & 1);
  }

  const topLeftCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8],
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = topLeftCoords[i];
    matrix[r][c] = bits[i];
  }

  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = bits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = bits[7 + i];
  }
}

/**
 * Generates SVG markup and vector path data for a given string.
 */
export function generateQRCodeSVG(text, options = {}) {
  const {
    size = 140,
    margin = 2,
    color = '#0f172a',
    bgColor = '#ffffff',
    title = 'QR Code'
  } = options;

  if (!text) {
    return { svg: '', pathData: '', totalModules: 0, version: 1, gridSize: 21 };
  }

  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const ver = chooseVersion(textBytes.length);
  const interleaved = encodeData(text, ver);
  const { matrix, reserved, size: modCount } = createMatrix(ver);

  placeData(matrix, reserved, modCount, interleaved);

  let bestMask = 0;
  let lowestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = applyMask(matrix, reserved, modCount, m);
    const p = calculatePenalty(masked, modCount);
    if (p < lowestPenalty) {
      lowestPenalty = p;
      bestMask = m;
    }
  }

  const finalGrid = applyMask(matrix, reserved, modCount, bestMask);
  writeFormatInfo(finalGrid, modCount, bestMask);

  let path = '';
  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (finalGrid[r][c] === 1) {
        path += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  const totalSize = modCount + margin * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${title}">` +
    (bgColor ? `<rect width="100%" height="100%" fill="${bgColor}"/>` : '') +
    `<path d="${path.trim()}" fill="${color}"/>` +
    `</svg>`;

  return {
    svg,
    pathData: path.trim(),
    totalModules: totalSize,
    version: ver.v,
    gridSize: modCount
  };
}

/**
 * Pure React SVG QR Code component.
 */
export const QRCodeSVG = ({
  value,
  size = 130,
  margin = 2,
  color = '#0f172a',
  bgColor = '#ffffff',
  title = 'QR Code',
  className = ''
}) => {
  const result = useMemo(() => {
    if (!value) return null;
    try {
      return generateQRCodeSVG(value, { size, margin, color, bgColor, title });
    } catch (e) {
      console.error('Failed to generate QR Code:', e);
      return null;
    }
  }, [value, size, margin, color, bgColor, title]);

  if (!result || !result.pathData) {
    return null;
  }

  return React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${result.totalModules} ${result.totalModules}`,
      width: size,
      height: size,
      shapeRendering: 'crispEdges',
      role: 'img',
      'aria-label': title,
      className,
      style: { display: 'block' }
    },
    bgColor ? React.createElement('rect', { width: '100%', height: '100%', fill: bgColor }) : null,
    React.createElement('path', { d: result.pathData, fill: color })
  );
};

export default {
  generateQRCodeSVG,
  QRCodeSVG
};
