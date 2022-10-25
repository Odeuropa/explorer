import { Fragment, useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import 'react-18-image-lightbox/style.css';
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
import OdeuropaPagination from '@components/OdeuropaPagination';
import GraphLink from '@components/GraphLink';
import MetadataList from '@components/MetadataList';
import SaveButton from '@components/SaveButton';
import { renderRowValues } from '@components/OdeuropaCard';
import breakpoints from '@styles/breakpoints';
import { getEntityMainLabel, generatePermalink } from '@helpers/explorer';
import { slugify } from '@helpers/utils';
import { getHighlightedText } from '@helpers/odeuropa';
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
  `}
`;

const Primary = styled.div`
  flex: auto;
  min-width: 50%;
  padding-right: 24px;
  margin-bottom: 24px;

  display: flex;
  flex-direction: column;
`;

const Secondary = styled.div`
  flex: auto;

  ${breakpoints.desktop`
    margin-left: 0;
    padding: 0 24px;
  `}
`;

const Separator = styled.div`
  border-bottom: 1px solid lightgray;
  margin: 1.5rem 0;
`;

const Panel = styled.div`
  flex: 1;
  background-color: #f5f5f5;
  padding: 1rem 2rem;

  &:not(:last-child) {
    margin-right: 1em;
  }
`;

Panel.Title = styled.div`
  color: #b9d59b;
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
  ${(props) => css`
    ${ExcerptTitle}:hover ${ExcerptPreview} {
      opacity: ${props.active ? 0 : 1};
    }
  `}
`;

const AnnotationContainer = styled.div`
  position: absolute;
  border: 4px solid #fff;
  opacity: 0.5;
  cursor: default;
  user-select: none;
  transition: opacity 250ms ease-in-out;

  ${({ highlighted }) =>
    highlighted
      ? css`
          opacity: 1;
          z-index: 10;
        `
      : null};

  &:hover {
    opacity: 1;
    z-index: 10;
  }
`;

const MAX_TITLE_LENGTH = 50;

const OdeuropaDetailsPage = ({ result, inList, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { query } = router;
  const { data: session } = useSession();
  const route = config.routes[query.type];
  const [isItemSaved, setIsItemSaved] = useState(inList);
  const [excerpts, setExcerpts] = useState([]);
  const [openedExcerpts, setOpenedExcerpts] = useState([]);
  const [fragmentsFilter, setFragmentsFilter] = useState([]);
  const [visibleFragments, setVisibleFragments] = useState([]);
  const [highlightedFragment, setHighlightedFragment] = useState(undefined);

  useEffect(() => {
    if (!result) return;
    if (result.relevantExcerpt) {
      setOpenedExcerpts([result.relevantExcerpt]);
    }

    const excerptsList = [].concat(result.source?.excerpts).filter((x) => x);
    excerptsList.sort((a, b) => {
      if (a['@id'] === b['@id']) return 0;
      return a['@id'] === result.relevantExcerpt ? -1 : 1;
    });
    setExcerpts(excerptsList);

    const fragmentsFilter = []
      .concat(result.fragment)
      .filter((x) => x)
      .map((fragment) => fragment.label)
      .filter((v, i, a) => a.indexOf(v) === i);
    setFragmentsFilter(fragmentsFilter);
    setVisibleFragments(fragmentsFilter);
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
        </NotFoundPage>
        ;
      </>
    );
  }

  const mainLabel = getEntityMainLabel(result, { route, language: i18n.language });

  const onItemSaveChange = (status) => {
    setIsItemSaved(status);
  };

  const renderHeader = () => {
    const { source } = result;

    const subtitles = [];
    if (typeof source.date === 'string') {
      subtitles.push(<>{result.date}</>);
    }

    const authors = [].concat(source.author).filter((x) => x);
    authors.forEach((author) => {
      if (author.label) {
        subtitles.push(
          <>
            {typeof author.sameAs === 'string' ? (
              <a href={author.sameAs} target="_blank" rel="noopener noreferrer">
                {author.label}
              </a>
            ) : (
              <>{author.label}</>
            )}
          </>
        );
      }
    });
    if (typeof result.place?.label === 'string') {
      subtitles.push(<>{result.place.label}</>);
    }

    return (
      <Element
        style={{
          minWidth: '50%',
          paddingTop: 24,
          marginBottom: 24,
        }}
      >
        <Element
          style={{ fontSize: '2rem', color: 'gray', fontWeight: 'bold', marginBottom: '1rem' }}
        >
          {result.image
            ? t('project:details.visualResource')
            : t('projects:details.textualResource')}
        </Element>
        <Element
          style={{ fontSize: '4rem', color: '#725cae', fontWeight: 'bold', lineHeight: '100%' }}
        >
          {source.label &&
            source.label.substr(0, MAX_TITLE_LENGTH - 1) +
              (source.label.length > MAX_TITLE_LENGTH ? '…' : '')}
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

        <Element display="flex" alignItems="center" justifyContent="space-between">
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
          <GraphLink uri={result['@graph']} icon label style={{ marginRight: '0.5em' }} />
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
            <small style={{ paddingLeft: 12 }}>
              {t('project:buttons.source')}{' '}
              <a href={result.source?.url} target="_blank" rel="noopener noreferrer">
                {result.source?.url}
              </a>
            </small>
          )}
        </Element>

        {result.source?.label?.length > MAX_TITLE_LENGTH &&
          renderPanelRow('Full title', result.source.label)}
      </Element>
    );
  };

  const renderTextualObject = () => {
    return (
      <Element>
        {excerpts.map((excerpt, i) => (
          <Element key={excerpt['@id']} id={slugify(excerpt['@id'])}>
            <ExcerptContainer
              active={openedExcerpts.includes(excerpt['@id'])}
              style={{
                backgroundColor: result.relevantExcerpt === excerpt['@id'] ? '#f5f5f5' : '',
              }}
            >
              <ExcerptTitle
                onClick={() => {
                  setOpenedExcerpts((prev) =>
                    prev.includes(excerpt['@id'])
                      ? prev.filter((x) => x !== excerpt['@id'])
                      : [...prev, excerpt['@id']]
                  );
                }}
              >
                <a
                  href={`#${slugify(excerpt['@id'])}`}
                  onClick={(e) => {
                    setOpenedExcerpts((prev) =>
                      prev.includes(excerpt['@id']) ? prev : [excerpt['@id']]
                    );
                    e.stopPropagation();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z" />
                  </svg>
                </a>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    width: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ marginLeft: 12, marginRight: 12 }}>Excerpt {i + 1}</span>
                  <ExcerptPreview>
                    {getHighlightedText(
                      excerpt.value,
                      excerpt['@id'] === result.relevantExcerpt ? mainLabel : null
                    )}
                  </ExcerptPreview>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  style={{
                    fill: '#333',
                    transform: openedExcerpts.includes(excerpt['@id'])
                      ? 'rotate(0deg)'
                      : 'rotate(180deg)',
                  }}
                >
                  <path d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z" />
                </svg>
              </ExcerptTitle>
              {openedExcerpts.includes(excerpt['@id']) &&
                renderExcerpt(
                  excerpt.value,
                  excerpt['@id'] === result.relevantExcerpt ? mainLabel : null
                )}
            </ExcerptContainer>
            {i < excerpts.length - 1 && <Separator />}
          </Element>
        ))}
      </Element>
    );
  };

  const renderVisualObject = () => {
    return (
      <Columns>
        <Primary>
          <Element marginBottom={12}>
            <h4>
              Annotations |{' '}
              <label>
                <input
                  type="checkbox"
                  checked={fragmentsFilter.length === visibleFragments.length}
                  onChange={(ev) => {
                    setVisibleFragments(ev.target.checked ? fragmentsFilter : []);
                  }}
                  style={{ verticalAlign: 'middle' }}
                />{' '}
                select all
              </label>
            </h4>
            <Element display="flex" flexWrap="wrap">
              {fragmentsFilter.map((fragment) => (
                <Element
                  key={fragment}
                  onMouseEnter={() => {
                    setHighlightedFragment(fragment);
                  }}
                  onMouseLeave={() => {
                    setHighlightedFragment(undefined);
                  }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={visibleFragments.includes(fragment)}
                      onChange={() => {
                        setVisibleFragments((prev) =>
                          prev.includes(fragment)
                            ? prev.filter((x) => x !== fragment)
                            : [...prev, fragment]
                        );
                      }}
                      style={{ verticalAlign: 'middle' }}
                    />{' '}
                    {fragment}
                  </label>
                </Element>
              ))}
            </Element>
          </Element>

          <Element>
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0]} alt="" />
              {fragments
                .filter((fragment) => visibleFragments.includes(fragment.label))
                .map((fragment) => (
                  <AnnotationContainer
                    key={fragment['@id']}
                    style={{
                      left: parseFloat(fragment.x),
                      top: parseFloat(fragment.y),
                      width: parseFloat(fragment.width),
                      height: parseFloat(fragment.height),
                    }}
                    highlighted={highlightedFragment === fragment.label}
                  >
                    <span
                      style={{
                        position: 'relative',
                        top: -27,
                        left: -4,
                        padding: 4,
                        lineHeight: '24px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fragment.label}{' '}
                      <span style={{ fontSize: '8px' }}>({parseFloat(fragment.score) * 100}%)</span>
                    </span>
                  </AnnotationContainer>
                ))}
            </div>
          </Element>
        </Primary>
        <Secondary>
          <Element marginBottom={24}>
            <h4>Metadata</h4>
            <MetadataList metadata={result} query={query} route={route} />
          </Element>
        </Secondary>
      </Columns>
    );
  };

  const renderExcerpt = (excerpt, highlight) => (
    <Element
      style={{ display: 'flex', alignItems: 'center', paddingLeft: '1em', paddingRight: '1em' }}
    >
      <Element
        style={{
          fontSize: '8rem',
          lineHeight: '8rem',
          marginRight: '2rem',
          alignSelf: 'flex-start',
          userSelect: 'none',
        }}
      >
        ‟
      </Element>
      <Element style={{ fontSize: '1.5rem', fontFamily: 'Times New Roman' }}>
        {getHighlightedText(excerpt, highlight)}
      </Element>
    </Element>
  );

  const renderPanelRow = (metaName, value, targetRouteName, targetProperty) => {
    if (typeof value === 'undefined' || value === null) {
      return null;
    }

    const renderedValue = renderRowValues(
      value,
      metaName,
      route,
      query.type,
      targetRouteName,
      targetProperty
    );

    const label = t(`project:metadata.${metaName}`, metaName);

    return (
      <Panel.Row key={metaName}>
        <Panel.Label>{label}</Panel.Label>
        <Panel.Value>{renderedValue}</Panel.Value>
      </Panel.Row>
    );
  };

  const smellEmissionRows = [
    renderPanelRow('source', result.smellSource, 'smell-sources', '@id'),
    renderPanelRow('carrier', result.carrier, 'odour-carriers', 'exemplifies'),
    renderPanelRow('date', result.time),
    renderPanelRow('place', result.place, 'fragrant-spaces', 'exemplifies'),
  ].filter((x) => x);

  const olfactoryExperienceRows = [
    renderPanelRow('actor', result.actor),
    renderPanelRow('emotion', result.emotion),
    renderPanelRow('definedAs', result.adjective),
  ].filter((x) => x);

  const images = [].concat(result.image).filter((x) => x);
  const fragments = [].concat(result.fragment).filter((x) => x);

  return (
    <Layout>
      <PageTitle title={`${result.source?.label || mainLabel}`} />
      <Header />
      <Body>
        <OdeuropaPagination result={result} style={{ marginTop: 24 }} />
        <Element marginLeft={48} marginRight={48}>
          {renderHeader()}

          {result.image ? renderVisualObject() : renderTextualObject()}

          <Separator />

          <Element>
            {(smellEmissionRows.length > 0 || olfactoryExperienceRows.length > 0) && (
              <Element display="flex">
                {smellEmissionRows.length > 0 && (
                  <Panel>
                    <Panel.Title>Smell Emission</Panel.Title>
                    <Panel.Body>{smellEmissionRows}</Panel.Body>
                  </Panel>
                )}

                {olfactoryExperienceRows.length > 0 && (
                  <Panel>
                    <Panel.Title>Olfactory Experience</Panel.Title>
                    <Panel.Body>{olfactoryExperienceRows}</Panel.Body>
                  </Panel>
                )}
              </Element>
            )}
          </Element>

          <Debug>
            <Separator />

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
        </Element>
      </Body>
      <Footer />
    </Layout>
  );
};

export async function getServerSideProps({ req, res, query, locale }) {
  const {
    result = null,
    inList = false,
    debugSparqlQuery,
  } = await (
    await fetch(`${process.env.SITE}/api/entity?${queryString.stringify(query)}`, {
      headers: {
        ...req.headers,
        'accept-language': locale,
      },
    })
  ).json();

  if (!result && res) {
    res.statusCode = 404;
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'project', 'search'])),
      result,
      inList,
      debugSparqlQuery,
    },
  };
}

export default OdeuropaDetailsPage;
