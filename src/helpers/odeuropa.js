import { Fragment } from 'react';

export const highlightAndUnderlineText = (text, highlightedWords, underlinedWords) => {
  const wordsToHighlight = highlightedWords.map((word) => word.toLowerCase());
  const wordsToUnderline = underlinedWords.map((word) => word.toLowerCase());

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

  const regex = new RegExp(`\\b(${highlightedWords.concat(underlinedWords).join('|')})\\b`, 'gi');

  return (
    <Fragment>
      {text.split(regex).map((word, index) => {
        return applyMarkup(word, index);
      })}
    </Fragment>
  );
};
