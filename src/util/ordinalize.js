import { pluralize } from './pluralize'
export const ordinalize = (number, word) => {
  if (word) {
    if (number === 1) {
      return `1 ${word}`;
    } else {
      return number + ' ' + pluralize(word);
    }
  } else {
    if ((11 <= (parseInt(number) % 100)) && ((parseInt(number) % 100) <= 13)) {
      return number + "th";
    } else {
      switch (parseInt(number) % 10) {
        case 1: return number + "st";
        case 2: return number + "nd";
        case 3: return number + "rd";
        default: return number + "th";
      }
    }
  }
};
