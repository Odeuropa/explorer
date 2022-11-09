import { Fragment } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { getEntityMainLabel } from '@helpers/explorer';
import { uriToId } from '@helpers/utils';
import { getHighlightedText } from '@helpers/odeuropa';
import config from '~/config';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.28) 0px 0px 8px;
`;

const Header = styled.div`
  font-family: 'Libre Caslon Text';
  font-weight: bold;
  background-color: #b9d59b;
  padding: 0.25rem 0.75rem;
  text-transform: uppercase;
  display: flex;
  align-items: center;
`;

const Title = styled.div`
  font-size: 1.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Date = styled.div`
  margin-left: auto;
`;

const Visual = styled.div`
  width: 100%;
  height: 250px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
`;

const Body = styled.div`
  padding: 0.75em;
  overflow-y: auto;
  max-height: 250px;
`;

const Row = styled.div`
  display: flex;
`;

const Label = styled.div`
  flex-shrink: 0;
  font-size: 0.9rem;
  width: 110px;
  margin-right: 1rem;
  padding-top: 0.25rem;
  text-transform: uppercase;
`;

const Value = styled.div`
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const Separator = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  --text-divider-gap: 0.5rem;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: #464c5a;

  &::before,
  &::after {
    content: '';
    height: 1px;
    background-color: silver;
    flex-grow: 1;
  }

  &::before {
    margin-right: var(--text-divider-gap);
  }

  &::after {
    margin-left: var(--text-divider-gap);
  }
`;

const Footer = styled.div`
  background-color: #b9d59b;
  text-align: center;
  padding: 0.5em 0.75em;
  text-transform: uppercase;
  margin-top: auto;
`;

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
      let inner = v;
      if (typeof v === 'object') {
        let url = null;

        const idValue = targetProperty ? v[targetProperty] : v['@id'];
        const targetRoute = config.routes[targetRouteName];
        if (targetRoute && idValue) {
          url = `/details/${targetRoute.details.view}?id=${encodeURIComponent(
            uriToId(idValue, {
              base: targetRoute.uriBase,
            })
          )}&type=${targetRouteName}`;
        } else {
          const filter =
            route && Array.isArray(route.filters) && route.filters.find((f) => f.id === metaName);
          if (filter && idValue) {
            url = `/${queryType}?field_filter_${metaName}=${encodeURIComponent(idValue)}`;
          }
        }

        const label = []
          .concat(v.label)
          .filter((x) => x)
          .join(', ');
        if (v.type) {
          inner = (
            <>
              {label} <small>({v.type})</small>
            </>
          );
        } else {
          inner = label;
        }

        if (url) {
          inner = (
            <Link href={url} passHref>
              <a>{inner}</a>
            </Link>
          );
        }
      }

      return <Fragment key={v['@id']}>{inner}</Fragment>;
    })
    .reduce((prev, curr) => [prev, ', ', curr]);
};

const OdeuropaCard = ({ item, route, type, displayText, onSeeMore, ...props }) => {
  const { t, i18n } = useTranslation();

  if (!item || !item['@id']) return null;

  const mainLabel = getEntityMainLabel(item, { route, language: i18n.language });

  const renderCardRow = (metaName, value, targetRouteName, targetProperty) => {
    if (typeof value === 'undefined' || value === null) {
      return null;
    }

    const renderedValue = renderRowValues(
      value,
      metaName,
      route,
      type,
      targetRouteName,
      targetProperty
    );

    const label = t(`project:metadata.${metaName}`, metaName);

    return (
      <Row key={label}>
        <Label>{label}</Label>
        <Value>
          <div>{renderedValue}</div>
        </Value>
      </Row>
    );
  };

  const renderBody = (item, highlightKeyword) => {
    if (highlightKeyword && item.text) {
      const text = []
        .concat(item.text)
        .filter((x) => x)
        .join(' ');
      const truncatedText = text.length < 200 ? text : text.substring(0, 200) + '…';
      return <Body>{getHighlightedText(truncatedText, highlightKeyword)}</Body>;
    }

    const smellEmissionRows = [
      renderCardRow('source', item.smellSource, 'smell-sources', '@id'),
      renderCardRow('carrier', item.carrier, 'odour-carriers', 'exemplifies'),
      renderCardRow('date', item.time),
      renderCardRow('smellPlace', item.place, 'fragrant-spaces', 'exemplifies'),
      renderCardRow('author', item.source?.author),
    ].filter((x) => x);

    const olfactoryExperienceRows = [
      renderCardRow('actor', item.actor),
      renderCardRow('emotion', item.emotion),
      renderCardRow('definedAs', item.adjective),
    ].filter((x) => x);

    if (smellEmissionRows.length > 0 || olfactoryExperienceRows.length > 0) {
      return (
        <Body>
          {smellEmissionRows}

          {olfactoryExperienceRows.length > 0 && (
            <>
              <Separator>Olfactory Experience</Separator>
              {olfactoryExperienceRows}
            </>
          )}
        </Body>
      );
    }
  };

  return (
    <Container {...props}>
      {(mainLabel || item.time?.label) && (
        <Header>
          <Title title={mainLabel}>{mainLabel}</Title>
          {item.time && <Date>{item.time.label}</Date>}
        </Header>
      )}
      {item.image && (
        <Link
          key={item['@id']}
          href={`/details/${route.details.view}?id=${encodeURIComponent(
            uriToId(item['@id'], {
              base: route.uriBase,
            })
          )}&type=${type}`}
          as={`/${type}/${encodeURI(uriToId(item['@id'], { base: route.uriBase }))}`}
          passHref
        >
          <a onClick={onSeeMore}>
            <Visual
              style={{
                backgroundImage: `url(${item.image})`,
              }}
            />
          </a>
        </Link>
      )}
      {renderBody(item, displayText ? mainLabel : undefined, route, type)}
      <Footer>
        <Link
          key={item['@id']}
          href={`/details/${route.details.view}?id=${encodeURIComponent(
            uriToId(item['@id'], {
              base: route.uriBase,
            })
          )}&type=${type}`}
          as={`/${type}/${encodeURI(uriToId(item['@id'], { base: route.uriBase }))}`}
          passHref
        >
          <a onClick={onSeeMore}>{t('project:buttons.seeMore')}</a>
        </Link>
      </Footer>
    </Container>
  );
};

export default OdeuropaCard;
