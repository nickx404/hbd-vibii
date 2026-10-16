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
for (const file of ['index.html', 'styles.css', 'app.js', 'font-lab.css', 'assets/mac-face.png', 'assets/adhi-face.png', 'assets/birthday-boy-face.png']) await access(new URL(file, import.meta.url));
const fontCss = await readFile(new URL('font-lab.css', import.meta.url), 'utf8');
for (const match of fontCss.matchAll(/url\('([^']+)'\)/g)) await access(new URL(match[1], import.meta.url));
const [html, app, css] = await Promise.all([
  readFile(new URL('index.html', import.meta.url), 'utf8'),
  readFile(new URL('app.js', import.meta.url), 'utf8'),
  readFile(new URL('styles.css', import.meta.url), 'utf8')
]);
assert.match(html, /id="password-gate"[\s\S]*id="password-input"[\s\S]*data-lock-digit="0"/, 'Password gate needs an accessible input and full number pad.');
assert.match(html, /PRIVATE ORBIT[\s\S]*CLEARANCE REQUIRED[\s\S]*It is a very special day for us\./, 'Password gate must keep the surprise discreet and include the clue.');
assert.doesNotMatch(html, /A little universe|birthday mission from Adhi|Open our universe/, 'Password gate must not reveal the birthday experience.');
assert.match(app, /ACCESS_CODE='9524'/, 'Birthday mission code must be 9524.');
assert.match(app, /sessionStorage\.getItem\(ACCESS_SESSION_KEY\)==='yes'/, 'The unlocked tab must skip the password gate after refresh.');
assert.match(app, /sessionStorage\.setItem\(ACCESS_SESSION_KEY,'yes'\)/, 'Successful clearance must persist for refreshes in the same tab.');
assert.match(app, /surface\.inert=true[\s\S]*surface\.inert=false/, 'Page content must stay inert until unlock.');
assert.match(css, /\.password-gate\[hidden\]\{display:none\}/, 'The accepted lock must leave the visible page.');
console.log('PASS: six complete chapters, four memory frames, three discoveries, letter, and all configured local assets.');
