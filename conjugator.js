// conjugator.js – only string manipulation

const PEOPLE = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];
const IMPERATIVES = ['tu', 'voi'];

/**
 * Return the correct present‑tense form for a verb and a person index.
 *
 * @param {Object} verb   The verb JSON entry.  Expected keys:
 *   - infinitive   (string)
 *   - irregular    (boolean, optional – defaults to false)
 *   - present      (array of 6 strings, optional)
 * @param {Number} person 0‑based index for: 0=io, 1=tu, 2=lui/lei, 3=noi, 4=voi, 5=loro
 * @returns {String|null} The conjugated form, or `null` if it cannot be determined.
 */
function present(verb, person) {
  /* 1️⃣  Use the stored form if it exists. */
  if (verb.present && Array.isArray(verb.present) && verb.present.length === 6) {
    return verb.present[person];
  }

  /* 2️⃣  If the verb is *explicitly* marked regular (or no flag at all),
         build the form from the infinitive. */
  const isRegular = verb.irregular === false || verb.irregular === undefined;
  if (isRegular) {
    const stem   = verb.infinitive.slice(0, -3);              // drop the trailing “are”
    const endings = ['o', 'i', 'a', 'iamo', 'ate', 'ano'];  // 6 persons
    return stem + endings[person];
  }

  /* 3️⃣  Irregular verb with no pre‑computed form: we can’t guess. */
  return null;   // or: throw new Error(`Unknown conjugation for ${verb.infinitive}`);
}

// Past (very crude – only used when verb is irregular)
function past(verb, person) {
  if (verb.irregular && verb.past) return verb.past[person];
  // Not needed for the demo – keep it simple
  return 'ho/sono ...';
}

// Imperative
function imperative(verb, person) {
  if (verb.irregular && verb.imperative) return verb.imperative[person];
  const stem = verb.infinitive.slice(0, -4);
  return stem + ['a','ate'][person];
}

module.exports = { PEOPLE, IMPERATIVES, present, past, imperative };