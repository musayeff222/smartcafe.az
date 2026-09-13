/**
 * react-image UMD paketində index.js.map yoxdur; source-map-loader xəbərdarlıq verir.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-image',
  'umd',
  'index.js.map'
);

const minimal =
  '{"version":3,"file":"index.js","sources":[],"names":[],"mappings":"","sourceRoot":""}';

try {
  if (!fs.existsSync(path.dirname(target))) {
    process.exit(0);
  }
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, minimal, 'utf8');
  }
} catch {
  process.exit(0);
}
