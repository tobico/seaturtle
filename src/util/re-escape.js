// Escapes a string for inclusion as a literal value in a regular expression.
export const reEscape = (s) => (
    String(s).replace(/\\|\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\^|\$/g, '\\$&')
);
