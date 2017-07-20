import { Inflector } from './inflector'

export const pluralize = (word) => (
  Inflector.translate(word, Inflector.uncountable, Inflector.irregular, Inflector.plural)
);
