import { Fragment, useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import 'react-image-lightbox/style.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { useTranslation } from 'next-i18next';

import NotFoundPage from '@pages/404';
import Header from '@components/Header';
import Footer from '@components/Footer';
import Layout from '@components/Layout';
import Body from '@components/Body';
import Element from '@components/Element';
import Metadata from '@components/Metadata';
import Debug from '@components/Debug';
import PageTitle from '@components/PageTitle';
import SPARQLQueryLink from '@components/SPARQLQueryLink';
import GraphLink from '@components/GraphLink';
import SaveButton from '@components/SaveButton';
import breakpoints from '@styles/breakpoints';
import { getEntityMainLabel, generatePermalink } from '@helpers/explorer';
import { slugify } from '@helpers/utils';
import config from '~/config';

const Columns = styled.div`
  display: flex;
  width: 100%;
  margin: 0 auto;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 24px;

  ${breakpoints.desktop`
    flex-direction: row;
    padding: 0 2em;
  `}
`;

const Primary = styled.div`
  flex: auto;
  min-width: 50%;
  padding-right: 24px;
  padding-top: 24px;
  margin-left: 24px;

  display: flex;
  flex-direction: column;
`;

const Separator = styled.div`
  border-bottom: 1px solid lightgray;
  margin: 1.5rem 0;
`;

const Panel = styled.div`
  flex: 1;
  background-color: #F5F5F5;
  padding: 1rem 2rem;

  &:not(:last-child) {
    margin-right: 1em;
  }
`;

Panel.Title = styled.div`
  color: #B9D59B;
  font-size: 1.4rem;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

Panel.Body = styled.div``;

Panel.Row = styled.div`
  display: flex;
`;

Panel.Label = styled.div`
  flex-shrink: 0;
  font-size: 0.9rem;
  width: 80px;
  margin-right: 1rem;
  padding-top: 0.25rem;
  text-transform: uppercase;
`;

Panel.Value = styled.div`
  font-size: 1.2rem;
`;

const ExcerptPreview = styled.span`
  color: #333;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  opacity: 0;
  padding: 0 12px;
`;

const ExcerptTitle = styled.div`
  color: #725cae;
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 1em;

  &:hover {
    background-color: #eee;
  }
`;

const ExcerptContainer = styled.div`
  ${props => css`
    ${ExcerptTitle}:hover ${ExcerptPreview} {
      opacity: ${props.active ? 0 : 1};
    }
  `}
`;

const getHighlightedText = (text, highlight) => {
  if (typeof highlight === 'undefined' || highlight === null) {
    return <span>{text}</span>;
  }
  // Split on highlight term and include term into parts, ignore case
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>{parts.map((part, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <span key={i} style={part.toLowerCase() === highlight.toLowerCase() ? { fontWeight: 'bold', backgroundColor: '#F2BB05', padding: '0.1em' } : {}}>{part}</span>
    ))}</span>
  );
};

const MAX_TITLE_LENGTH = 50;

const OdeuropaDetailsPage = ({ result, inList, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { query } = router;
  const { data: session } = useSession();
  const route = config.routes[query.type];
  const [isItemSaved, setIsItemSaved] = useState(inList);
  const [fragments, setFragments] = useState([]);
  const [openedExcerpts, setOpenedExcerpts] = useState([]);

  useEffect(() => {
    if (!result) return;
    if (result.relevantFragment) {
      setOpenedExcerpts([result.relevantFragment]);
    }

    const fragmentsList = [].concat(result.source?.fragments).filter(x => x);
    fragmentsList.sort((a, b) => {
      if (a['@id'] === b['@id']) return 0;
      return a['@id'] === result.relevantFragment ? -1 : 1;
    });
    setFragments(fragmentsList);
  }, [result]);

  if (!result) {
    return (
      <>
        <NotFoundPage text={t('common:errors.resultNotFound')}>
          <Debug>
            <Metadata label="HTTP Parameters">
              <pre>{JSON.stringify(query, null, 2)}</pre>
            </Metadata>
            <Metadata label="Query Result">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </Metadata>
            <Metadata label="SPARQL Query">
              <SPARQLQueryLink query={debugSparqlQuery}>
                {t('common:buttons.editQuery')}
              </SPARQLQueryLink>
              <pre>{debugSparqlQuery}</pre>
            </Metadata>
          </Debug>
        </NotFoundPage>;
      </>
    );
  }

  const mainLabel = getEntityMainLabel(result, { route, language: i18n.language });

  const onItemSaveChange = (status) => {
    setIsItemSaved(status);
  };

  const renderTextualObject = (source) => {
    const subtitles = [];
    if (typeof source.date === 'string') {
      subtitles.push(<>{result.date}</>);
    }

    const authors = [].concat(source.author).filter(x => x);
    authors.forEach(author => {
      if (author.label) {
        subtitles.push(<>{typeof author.sameAs === 'string' ? (<a href={author.sameAs} target="_blank" rel="noopener noreferrer">{author.label}</a>) : (<>{author.label}</>)}</>);
      }
    });
    if (typeof result.place?.label === 'string') {
      subtitles.push(<>{result.place.label}</>);
    }

    return (
      <Element>
        <Element style={{ fontSize: '2rem', color: 'gray', fontWeight: 'bold', marginBottom: '1rem' }}>
          Textual resource
        </Element>
        <Element style={{ fontSize: '4rem', color: '#725cae', fontWeight: 'bold', lineHeight: '100%' }}>
          {source.label && source.label.substr(0, MAX_TITLE_LENGTH - 1) + (source.label.length > MAX_TITLE_LENGTH ? '…' : '')}
        </Element>
        <Element style={{ fontSize: '2rem', color: 'black' }}>
          {subtitles.map((subtitle, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={i}>
              {subtitle}
              {i > 0 && i < subtitles.length - 1 && ', '}
            </Fragment>
          ))}
        </Element>
      </Element>
    );
  }

  const renderExcerpt = (excerpt, highlight) => (
    <Element style={{ display: 'flex', alignItems: 'center', paddingLeft: '1em', paddingRight: '1em' }}>
      <Element style={{ fontSize: '8rem', lineHeight: '8rem', marginRight: '2rem', alignSelf: 'flex-start', userSelect: 'none' }}>‟</Element>
      <Element style={{ fontSize: '1.5rem', fontFamily: 'Times New Roman' }}>{getHighlightedText(excerpt, highlight)}</Element>
    </Element>
  );

  const renderPanelRow = (label, value) => {
    if (typeof value === 'undefined' || value === null) {
      return null;
    }

    const values = [].concat(value).filter(x => x);
    const renderedValue = values.map(v => typeof v === 'object' ? v.label : v).join(', ');

    return (
      <Panel.Row>
        <Panel.Label>{label}</Panel.Label>
        <Panel.Value>{renderedValue}</Panel.Value>
      </Panel.Row>
    )
  }

  return (
    <Layout>
      <PageTitle title={`${result.source?.label || mainLabel}`} />
      <Header />
      <Body>
        <Columns>
          <Primary>
            <Element>
              {renderTextualObject(result.source)}

              <Element
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                {session && (
                  <SaveButton
                    type={query.type}
                    item={result}
                    saved={isItemSaved}
                    onChange={onItemSaveChange}
                  />
                )}
              </Element>

              <Element marginBottom={12} display="flex">
                <GraphLink uri={result['@graph']} icon label />{' '}
                {route.details.showPermalink && (
                  <small>
                    (
                    <a href={generatePermalink(result['@id'])} target="_blank" rel="noopener noreferrer">
                      {t('common:buttons.permalink')}
                    </a>
                    )
                  </small>
                )}
                {result.source?.url && (
                  <small style={{ marginLeft: 'auto', paddingLeft: 12 }}>
                    {t('project:buttons.source')} <a href={result.source?.url} target="_blank" rel="noopener noreferrer">{result.source?.url}</a>
                  </small>
                )}
              </Element>
            </Element>

            {result.source?.label?.length > MAX_TITLE_LENGTH && renderPanelRow('Full title', result.source.label)}

            <Separator />

            <Element marginBottom={24} display="flex">
              <Panel>
                <Panel.Title>Smell Emission</Panel.Title>
                <Panel.Body>
                  {renderPanelRow('Source', result.smellSource)}
                  {renderPanelRow('Carrier', result.carrier)}
                  {renderPanelRow('Date', result.time)}
                  {renderPanelRow('Place', result.place)}
                </Panel.Body>
              </Panel>

              <Panel>
                <Panel.Title>Olfactory Experience</Panel.Title>
                <Panel.Body>
                  {renderPanelRow('Actor', result.actor)}
                  {renderPanelRow('Emotion', result.emotion)}
                  {renderPanelRow('Defined as', result.adjective)}
                </Panel.Body>
              </Panel>
            </Element>

            <Separator />

            {fragments.map((fragment, i) => (
              <Element key={fragment['@id']} id={slugify(fragment['@id'])}>
                <ExcerptContainer active={openedExcerpts.includes(fragment['@id'])} style={{ backgroundColor: result.relevantFragment === fragment['@id'] ? '#f5f5f5' : '' }}>
                  <ExcerptTitle onClick={() => {
                    setOpenedExcerpts(prev => prev.includes(fragment['@id']) ? prev.filter(x => x !== fragment['@id']) : [...prev, fragment['@id']]);
                  }}>
                    <a href={`#${slugify(fragment['@id'])}`} onClick={(e) => {
                      setOpenedExcerpts(prev => prev.includes(fragment['@id']) ? prev : [fragment['@id']]);
                      e.stopPropagation();
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z"/></svg>
                    </a>
                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%' }}>
                      <span style={{ marginLeft: 12, marginRight: 12 }}>Excerpt {i + 1}</span>
                      <ExcerptPreview>{getHighlightedText(fragment.value, fragment['@id'] === result.relevantFragment ? mainLabel : null)}</ExcerptPreview>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ fill: '#333', transform: openedExcerpts.includes(fragment['@id']) ? 'rotate(0deg)' : 'rotate(180deg)' }}><path d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"/></svg>
                  </ExcerptTitle>
                  {openedExcerpts.includes(fragment['@id']) && renderExcerpt(fragment.value, fragment['@id'] === result.relevantFragment ? mainLabel : null)}
                </ExcerptContainer>
                <Separator />
              </Element>
            ))}

            <Debug>
              <Metadata label="HTTP Parameters">
                <pre>{JSON.stringify(query, null, 2)}</pre>
              </Metadata>
              <Metadata label="Query Result">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </Metadata>
              <Metadata label="SPARQL Query">
                <SPARQLQueryLink query={debugSparqlQuery}>
                  {t('common:buttons.editQuery')}
                </SPARQLQueryLink>
                <pre>{debugSparqlQuery}</pre>
              </Metadata>
            </Debug>
          </Primary>
        </Columns>
      </Body>
      <Footer />
    </Layout>
  );
};

export async function getServerSideProps({ req, res, query, locale }) {
  const { result = null, inList = false, debugSparqlQuery } = await (
    await fetch(`${process.env.SITE}/api/entity?${queryString.stringify(query)}`, {
      headers:
        req && req.headers
          ? {
              cookie: req.headers.cookie,
            }
          : undefined,
    })
  ).json();

  if (!result && res) {
    res.statusCode = 404;
  }

  return {
    props: {
      ...await serverSideTranslations(locale, ['common', 'project']),
      result,
      inList,
      debugSparqlQuery,
    }
  };
};

export default OdeuropaDetailsPage;
