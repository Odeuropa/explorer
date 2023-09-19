import Link from 'next/link';
import { Fragment } from 'react';
import { uriToId } from '@helpers/utils';
import config from '~/config';

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

export const renderRowValues = (
  value,
  metaName,
  route,
  queryType,
  targetRouteName,
  targetProperty
) => {
  const values = [].concat(value).filter((x) => x);
  return values
    .map((v) => {
      let inner;
      if (typeof v === 'string') {
        inner = v;
      } else if (typeof v === 'object') {
        let url = null;

        const idValue = [].concat(targetProperty ? v[targetProperty] : v['@id']).filter((x) => x);
        const targetRoute = config.routes[targetRouteName];
        if (idValue.length > 0) {
          if (targetRoute) {
            url = `/details/${targetRoute.details.view}?id=${encodeURIComponent(
              uriToId(idValue[0], {
                base: targetRoute.uriBase,
              })
            )}&type=${targetRouteName}`;
          } else {
            const filter =
              route && Array.isArray(route.filters) && route.filters.find((f) => f.id === metaName);
            if (filter && v.type) {
              url = `/${queryType}?filter_${metaName}=${encodeURIComponent(
                v.type?.['@id'] || idValue[0]
              )}`;
            }
          }
        }

        const label = []
          .concat(v.label)
          .filter((x) => x)
          .join(', ');
        if (v.type?.label) {
          inner = <Link href={url}>{v.type.label}</Link>;
        } else if (url) {
          inner = <Link href={url}>{label}</Link>;
        } else {
          inner = label;
        }
      }

      return <Fragment key={v['@id']}>{inner}</Fragment>;
    })
    .reduce((prev, curr, i) => [prev, <Fragment key={i}>,&nbsp;</Fragment>, curr]);
};
