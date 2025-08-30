// test.js
const { introPresent, introImperative } = require('./intro');
console.log('Imported:', typeof introPresent, typeof introImperative);
introPresent();
introImperative();