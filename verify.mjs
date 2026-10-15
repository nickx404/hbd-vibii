// Validate editable content and local assets before handing off or hosting.
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(await readFile(new URL('content.js', import.meta.url), 'utf8'), context);
const data = context.window.MISSION_CONTENT;
const supported = ['launch', 'cinema', 'stars', 'galaxy', 'nebula', 'birthday'];
assert.deepEqual(Array.from(data.chapters, c => c.id), supported, 'Every chapter must map to a supported illustrated scene.');
for (const chapter of data.chapters) {
  for (const field of ['label', 'kicker', 'title', 'copy', 'action', 'aside', 'caption', 'speech']) {
    assert.equal(typeof chapter[field], 'string', `${chapter.id}: missing ${field}`);
    assert.ok(chapter[field].trim(), `${chapter.id}: empty ${field}`);
  }
  assert.ok(chapter.speech.split('<br>').length <= 2, `${chapter.id}: speech bubble fits two lines.`);
}
assert.equal(data.photos.length, 4, 'The galaxy has four photo frames.');
for (const photo of data.photos) {
  assert.ok(photo.title && photo.caption && photo.placeholder, 'Each photo needs accessible text and a fallback label.');
  if (photo.src) {
    assert.ok(!/^[a-z]+:|^\/\//i.test(photo.src), 'Use a local photo so the experience works without external services.');
    await access(new URL(photo.src, import.meta.url));
  }
}
assert.equal(data.starMessages.length, 3, 'Every nickname star must have a discovery.');
assert.ok(data.letter.length > 0 && data.letter.every(p => typeof p === 'string' && p.trim()), 'The letter needs readable paragraphs.');
for (const file of ['index.html', 'styles.css', 'app.js', 'font-lab.css']) await access(new URL(file, import.meta.url));
const fontCss = await readFile(new URL('font-lab.css', import.meta.url), 'utf8');
for (const match of fontCss.matchAll(/url\('([^']+)'\)/g)) await access(new URL(match[1], import.meta.url));
console.log('PASS: six complete chapters, four memory frames, three discoveries, letter, and all configured local assets.');
