import { Fragment } from 'react';

/**
 * Takes a string of text, a list of words to highlight, and a list of words to underline, and
 * returns a React component that renders the text with the specified words highlighted and underlined
 * @param text - The text to be highlighted and underlined.
 * @param [highlightedWords] - An array of words to highlight.
 * @param [underlinedWords] - An array of words to underline.
 * @returns A React component that highlights and underlines words in a string.
 */
export const highlightAndUnderlineText = (text, highlightedWords = [], underlinedWords = []) => {
  const wordsToHighlight = highlightedWords.filter((x) => x).map((word) => word.toLowerCase());
  const wordsToUnderline = underlinedWords.filter((x) => x).map((word) => word.toLowerCase());

  function applyMarkup(word, index) {
    const lowerCaseWord = word.toLowerCase();
    const isHighlighted = wordsToHighlight.includes(lowerCaseWord);
    const isUnderlined = wordsToUnderline.includes(lowerCaseWord);
    let markup = <Fragment key={index}>{word}</Fragment>;

    if (isHighlighted && isUnderlined) {
      markup = (
        <u key={index}>
          <mark>{word}</mark>
        </u>
      );
    } else if (isHighlighted) {
      markup = <mark key={index}>{word}</mark>;
    } else if (isUnderlined) {
      markup = <u key={index}>{word}</u>;
    }

    return markup;
  }

  const regex = new RegExp(
    `(?![\\s,.:;"\']|^)(${wordsToHighlight
      .concat(wordsToUnderline)
      .map((s) => s.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'))
      .join('|')})(?=[\\s,.:;"\']|$)`,
    'g'
  );

  return (
    <Fragment>
      {text.split(regex).map((word, index) => {
        return applyMarkup(word, index);
      })}
    </Fragment>
  );
};
