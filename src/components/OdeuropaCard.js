import { Fragment } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

import { getEntityMainLabel } from '@helpers/explorer';
import { uriToId } from '@helpers/utils';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: rgba(0, 0, 0, 0.28) 0px 0px 8px;
`;

const Header = styled.div`
  font-family: Garamond;
  font-weight: bold;
  background-color: #b9d59b;
  padding: 0.25rem 0.75rem;
  text-transform: uppercase;
  display: flex;
  align-items: center;
`;

const Title = styled.div`
  font-size: 1.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Date = styled.div`
  margin-left: auto;
`;

const Visual = styled.div`
  width: 100%;
  height: 300px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
`;

const Body = styled.div`
  padding: 0.75em;
`;

const Row = styled.div`
  display: flex;
`;

const Label = styled.div`
  flex-shrink: 0;
  font-size: 0.9rem;
  width: 80px;
  margin-right: 1rem;
  padding-top: 0.25rem;
  text-transform: uppercase;
`;

const Value = styled.div`
  font-size: 1.2rem;
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

const renderCardRow = (label, value) => {
  if (typeof value === 'undefined' || value === null) {
    return null;
  }

  const values = [].concat(value).filter((x) => x);
  const renderedValue = values
    .map((v) => {
      let inner = v;
      if (typeof v === 'object') {
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
      }
      return <Fragment key={inner}>{inner}</Fragment>;
    })
    .reduce((prev, curr) => [prev, ', ', curr]);

  return (
    <Row>
      <Label>{label}</Label>
      <Value>{renderedValue}</Value>
    </Row>
  );
};

const renderBody = (item) => {
  const smellRows = [];
  const experienceRows = [];

  const smellKeys = {
    smellSource: 'Source',
    carrier: 'Carrier',
    time: 'Date',
    place: 'Place',
  };

  const experienceKeys = {
    actor: 'Actor',
    gesture: 'Gesture',
    emotion: 'Emotion',
    adjective: 'Defined as',
  };

  Object.entries(smellKeys).forEach(([key, label]) => {
    if (item[key]) {
      smellRows.push(<Fragment key={key}>{renderCardRow(label, item[key])}</Fragment>);
    }
  });

  Object.entries(experienceKeys).forEach(([key, label]) => {
    if (item[key]) {
      experienceRows.push(<Fragment key={key}>{renderCardRow(label, item[key])}</Fragment>);
    }
  });

  if (smellRows.length > 0 || experienceRows.length > 0) {
    return (
      <Body>
        {smellRows}

        {experienceRows.length > 0 && (
          <>
            <Separator>Olfactory Experience</Separator>
            {experienceRows}
          </>
        )}
      </Body>
    );
  }
};

const OdeuropaCard = ({ item, route, type, onSeeMore, ...props }) => {
  const { i18n } = useTranslation();

  if (!item || !item['@id']) return null;

  const mainLabel = getEntityMainLabel(item, { route, language: i18n.language });

  return (
    <Container {...props}>
      <Header>
        <Title title={mainLabel}>{mainLabel}</Title>
        {item.time && <Date>{item.time.label}</Date>}
      </Header>
      {item.image && (
        <Visual
          style={{
            backgroundImage: `url(${item.image})`,
          }}
        />
      )}
      {renderBody(item)}
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
          <a onClick={onSeeMore}>See more</a>
        </Link>
      </Footer>
    </Container>
  );
};

export default OdeuropaCard;
