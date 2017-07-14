import { Inflector } from './inflector'

export const singularize = (word) => (
  Inflector.translate(word, Inflector.uncountable, Inflector.irregularInv || Inflector.makeIrregularInv(), Inflector.singular)
);
