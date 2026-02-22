const path = require("path");

/** Resolved path to the test image fixture (relative to this file). */
const testImagePath = path.resolve(__dirname, "..", "fixtures", "test-image.png");

module.exports = { testImagePath };
