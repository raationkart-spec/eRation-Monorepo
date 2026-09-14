const fs = require('fs');
const path = require('path');

const gradlePath = path.resolve(__dirname, '../android/app/build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.error(`FATAL: build.gradle not found at ${gradlePath}`);
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

console.log('Configuring Android release signing in build.gradle...');

// 1. Add release signingConfig
if (!content.includes("keyAlias 'quickcart'")) {
  content = content.replace(
    'signingConfigs {',
    `signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword 'quickcart123'
            keyAlias 'quickcart'
            keyPassword 'quickcart123'
        }`
  );
}

// 2. Set release buildType to signingConfigs.release
const buildTypesIdx = content.indexOf('buildTypes {');
if (buildTypesIdx === -1) {
  console.error('FATAL: buildTypes block not found in build.gradle');
  process.exit(1);
}

const beforeBuildTypes = content.slice(0, buildTypesIdx);
let afterBuildTypes = content.slice(buildTypesIdx);

const releaseIdx = afterBuildTypes.indexOf('release {');
if (releaseIdx === -1) {
  console.error('FATAL: release block not found in buildTypes');
  process.exit(1);
}

const beforeRelease = afterBuildTypes.slice(0, releaseIdx);
let releaseBlock = afterBuildTypes.slice(releaseIdx);

// Replace signingConfig inside release block
releaseBlock = releaseBlock.replace(
  /signingConfig\s+signingConfigs\.\w+/,
  'signingConfig signingConfigs.release'
);

afterBuildTypes = beforeRelease + releaseBlock;
content = beforeBuildTypes + afterBuildTypes;

fs.writeFileSync(gradlePath, content, 'utf8');
console.log('Updated build.gradle successfully.');

// Verification
const verifyContent = fs.readFileSync(gradlePath, 'utf8');
const verifyBuildTypes = verifyContent.slice(verifyContent.indexOf('buildTypes {'));
const verifyRelease = verifyBuildTypes.slice(verifyBuildTypes.indexOf('release {'));
const releaseMatch = verifyRelease.match(/signingConfig\s+signingConfigs\.(\w+)/);

if (!releaseMatch || releaseMatch[1] !== 'release') {
  console.error('FATAL: Verification failed! Release block is not using signingConfigs.release. Found:', releaseMatch ? releaseMatch[0] : 'null');
  process.exit(1);
}

console.log('VERIFIED: buildTypes.release is successfully pointing to signingConfigs.release');
