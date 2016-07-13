'use strict';

const sizeOf = require('image-size');
const request = require('request');
const cheerio = require('cheerio');
const YAML = require('js-yaml');
const slug = require('slug');
const pr = require('path').resolve;
const fs = require('fs');

const DATA_DIR = pr(__dirname, '../../src/data');
let images = YAML.safeLoad(fs.readFileSync(pr(DATA_DIR, 'images.yaml')));

const CACHE_DIR = pr(__dirname, '../../.cache');
try {
  fs.mkdirSync(CACHE_DIR);
} catch (e) {
  if (e.code !== 'EEXIST') throw e;
}

function findImage(stationName) {
  return new Promise((resolve, reject) => {
    let name = stationName;
    let url = images[name];
    if (!url) return resolve(null);
    url = url.replace(/uselang=..&?/, 'uselang=en');
    console.log(url);

    let metadataPath = pr(CACHE_DIR, slug(name) + '.json');
    let imagePath = pr(CACHE_DIR, slug(name) + '.jpg');

    // See if we have stuff in the cache
    try {
      let imageBuffer = fs.readFileSync(imagePath);
      let metadataBuffer = fs.readFileSync(metadataPath);
      if (imageBuffer && metadataBuffer) {
        resolve({
          image: imageBuffer,
          metadata: JSON.parse(metadataBuffer),
          dimensions: sizeOf(imageBuffer),
        });
        return;
      }
    } catch (e) {
      if (e.code !== 'ENOENT') return reject(e);
      console.log('Image not found in cache');
    }
      let imageUrl = url;
      let metadata = { 'Author': '' };
      request(imageUrl, { encoding: null }, function (error, res, buffer) {
        if (error || res.statusCode !== 200) {
          return reject(error);
        }
        let imageBuffer = buffer;
        fs.writeFileSync(imagePath, buffer);
        resolve({
          image: imageBuffer,
          metadata: metadata,
          dimensions: sizeOf(imageBuffer),
        });
      });
  });
}

module.exports = findImage;
