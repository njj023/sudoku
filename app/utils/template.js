/**
 * Simple template handler written using ES6 template strings.
 * Using a JavaScript based templating solution such as this allows us to utilize all the powerful
 * JS constructs in building templates.
 *
 * Code from: http://www.2ality.com/2015/01/template-strings-html.html
*/

function htmlEscape(str) {
  return str.toString().replace(/&/g, '&amp;') // first!
    .replace(/>/g, '&gt;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function html(literalSections, ...substs) {
  // Use raw literal sections: we don’t want
  // backslashes (\n etc.) to be interpreted
  let raw = literalSections.raw;

  let result = '';

  substs.forEach((subst, i) => {
    // Retrieve the literal section preceding
    // the current substitution
    let lit = raw[i];

    // If substitution is an array (and not a string),
    // we turn it into a string
    if (Array.isArray(subst)) {
      subst = subst.join('');
    }

    // If the substitution is preceded by a dollar sign,
    // we escape special characters in it
    if (lit.endsWith('$')) {
      subst = htmlEscape(subst);
      lit = lit.slice(0, -1);
    }
    result += lit;
    result += subst;
  });
  // Take care of last literal section
  // (Never fails, because an empty template string
  // produces one literal section, an empty string)
  result += raw[raw.length-1]; // (A)

  return result;
}

module.exports = {
  html: html
};