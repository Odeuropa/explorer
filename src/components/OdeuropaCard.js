import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import Element from '@components/Element';
import SaveButton from '@components/SaveButton';
import PaginatedLink from '@components/PaginatedLink';
import { getEntityMainLabel } from '@helpers/explorer';
import { highlightAndUnderlineText, renderRowValues } from '@helpers/odeuropa';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.28) 0px 0px 8px;
`;

const SaveButtonContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 8px 0.25em;
  margin: 8px;
  background-color: #e7e7e7;
  border-radius: 16px;
`;

const Header = styled.div`
  font-family: 'Libre Caslon Text';
  font-weight: bold;
  background-color: #b9d59b;
  padding: 0.25rem 0.75rem;
  text-transform: uppercase;
  display: flex;
  align-items: center;

  a {
    color: inherit;
    text-decoration: none;
  }
`;

const VisualHeader = styled.div`
  position: relative;
`;

const Title = styled.div`
  font-size: 1.3rem;
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

  a {
    color: inherit;
    text-decoration: none;
  }
`;

const OdeuropaCard = ({
  item,
  route,
  type,
  page,
  displayText,
  searchApi,
  searchParams,
  onSeeMore,
  isFavorite,
  onToggleFavorite,
  showFavorite = true,
  ...props
}) => {
  const { t, i18n } = useTranslation(['project']);

  if (!item || !item['@id']) return null;

  const mainLabel = getEntityMainLabel(item, { route, language: i18n.language });

  const renderCardRow = (metaName, value, { targetRouteName, targetProperty, truncate } = {}) => {
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

    const style = truncate
      ? {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      : {
          display: 'flex',
          flexWrap: 'wrap',
        };

    return (
      <Row key={metaName}>
        <Label>{label}</Label>
        <Value style={style}>{renderedValue}</Value>
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
      return <Body>{highlightAndUnderlineText(truncatedText, [highlightKeyword], [])}</Body>;
    }

    const smellEmissionRows = [
      renderCardRow('author', item.source?.author, {
        truncate: true,
      }),
      renderCardRow('artist', item.source?.artist, {
        truncate: true,
      }),
      renderCardRow('title', item.source?.label, {
        truncate: true,
      }),
      renderCardRow('date', item.time),
      renderCardRow('source', item.smellSource, {
        targetRouteName: 'smell-sources',
        targetProperty: '@id',
      }),
      renderCardRow('carrier', item.carrier),
      renderCardRow('smellPlace', item.place, {
        targetRouteName: 'fragrant-spaces',
        targetProperty: 'exemplifies',
      }),
    ].filter((x) => x);

    const olfactoryExperienceRows = [
      renderCardRow('actor', item.actor),
      renderCardRow('emotion', item.emotion),
      renderCardRow('definedAs', item.adjective),
      renderCardRow('language', item.source?.language),
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

  const linkProps = {
    id: item['@id'],
    type,
    page,
    searchApi,
    searchParams,
    passHref: true,
  };

  return (
    <Container {...props}>
      {(mainLabel || item.time?.label) && (
        <Header>
          <Element style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <PaginatedLink {...linkProps} onClick={onSeeMore}>
              <Title title={mainLabel}>{mainLabel}</Title>
              {item.time && <Date>{item.time.label}</Date>}
            </PaginatedLink>
          </Element>
          {showFavorite && (
            <Element marginLeft="auto">
              <SaveButton
                type={type}
                item={item}
                saved={isFavorite}
                onChange={onToggleFavorite}
                hideLabel
                style={{ padding: 8 }}
              />
            </Element>
          )}
        </Header>
      )}
      {item.image && (
        <VisualHeader>
          <PaginatedLink {...linkProps} onClick={onSeeMore}>
            <Visual
              style={{
                backgroundImage: `url(${item.image})`,
              }}
            />
          </PaginatedLink>
          {showFavorite && (
            <SaveButtonContainer>
              <SaveButton
                type={type}
                item={item}
                saved={isFavorite}
                onChange={onToggleFavorite}
                hideLabel
              />
            </SaveButtonContainer>
          )}
        </VisualHeader>
      )}
      {renderBody(item, displayText ? mainLabel : undefined, route, type)}
      <Footer>
        <PaginatedLink {...linkProps} onClick={onSeeMore}>
          {t('project:buttons.seeMore')}
        </PaginatedLink>
      </Footer>
    </Container>
  );
};

export default OdeuropaCard;
