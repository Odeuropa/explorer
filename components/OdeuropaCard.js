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
  background-color: #B9D59B;
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
  color: #464C5A;

  &::before, &::after {
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
  background-color: #B9D59B;
  text-align: center;
  padding: 0.5em 0.75em;
  text-transform: uppercase;
  margin-top: auto;
`;

const renderCardRow = (label, value) => {
  if (typeof value === 'undefined' || value === null) {
    return null;
  }

  const renderedValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <Row>
      <Label>{label}</Label>
      <Value>{renderedValue}</Value>
    </Row>
  )
}

const OdeuropaCard = ({ item, route, type, ...props }) => {
  const { i18n } = useTranslation();

  if (!item || !item['@id']) return null;

  return (
    <Container {...props}>
      <Header>
        <Title>
          {getEntityMainLabel(item, { route, language: i18n.language })}
        </Title>
        {item.time && (
          <Date>
            {item.time}
          </Date>
        )}
      </Header>
      <Body>
        {item.image && (
          <div style={{ width: '100%', height: 300, backgroundImage: `url(${item.image})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
        )}
        {renderCardRow('Source', item.source)}
        {renderCardRow('Carrier', item.carrier)}
        {renderCardRow('Date', item.time)}
        {renderCardRow('Place', item.place)}

        {(item.actor || item.gesture || item.adjective) && (
          <Separator>Olfactory Experience</Separator>
        )}

        {renderCardRow('Actor', item.actor)}
        {renderCardRow('Gesture', item.gesture)}
        {renderCardRow('Defined as', item.adjective)}
      </Body>
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
          <a>
            See more
          </a>
        </Link>
      </Footer>
    </Container>
  );
};

export default OdeuropaCard;
