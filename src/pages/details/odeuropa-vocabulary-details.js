import { useEffect, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import 'react-18-image-lightbox/style.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { TagCloud } from 'react-tagcloud';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronUp } from '@styled-icons/boxicons-regular/ChevronUp';
import { useTranslation } from 'next-i18next';

import NotFoundPage from '@pages/404';
import { getImageUrl } from '@pages/odeuropa-vocabulary';
import Header from '@components/Header';
import Footer from '@components/Footer';
import Layout from '@components/Layout';
import Body from '@components/Body';
import Element from '@components/Element';
import Spinner from '@components/Spinner';
import Metadata from '@components/Metadata';
import Debug from '@components/Debug';
import PageTitle from '@components/PageTitle';
import SPARQLQueryLink from '@components/SPARQLQueryLink';
import OdeuropaCard from '@components/OdeuropaCard';
import OdeuropaTimeline from '@components/OdeuropaTimeline';
import { absoluteUrl, uriToId } from '@helpers/utils';
import { getEntityMainLabel, findRouteByRDFType } from '@helpers/explorer';
import config from '~/config';

const Results = styled.div`
  display: grid;
  grid-auto-flow: ${({ showAll }) => (showAll ? 'row' : 'column')};
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-auto-columns: 400px;
  overflow-x: auto;
  overflow-y: hidden;
  grid-gap: 20px;
`;

const Result = styled.div`
  padding: 1em;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const ShowMoreIcon = styled.svg`
  width: 2em;
  height: 2em;
`;

const ShowMore = styled.div`
  display: flex;
  flex-direction: row;
  cursor: pointer;
  position: relative;
  margin: 2em;
  text-transform: uppercase;

  &::before,
  &::after {
    content: '';
    flex: 1 1;
    border-bottom: 2px solid;
    margin: auto;
  }

  &::before {
    margin-right: 10px;
  }

  &::after {
    margin-left: 10px;
  }

  div {
    display: flex;
    flex-direction: column;
    align-items: center;

    svg {
      position: absolute;
    }
  }

  & ${ShowMoreIcon} {
    top: ${({ active }) => (active ? '-1.5em' : 'inherit')};
    bottom: ${({ active }) => (active ? 'inherit' : '-1.5em')};
  }
`;

const OdeuropaMap = dynamic(() => import('@components/OdeuropaMap'), { ssr: false });

const TIMELINE_INTERVAL = 20; // years

const filterItemWithDate = (item, targetDate) => {
  if (!targetDate) return true;
  const time = [].concat(item.time).filter((x) => x)[0];
  const timeBegin = parseInt(time?.begin, 10);
  return timeBegin >= targetDate && timeBegin < targetDate + TIMELINE_INTERVAL;
};

const OdeuropaVocabularyDetailsPage = ({ result, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { req, query } = router;
  const route = config.routes[query.type];
  const [wordCloud, setWordCloud] = useState();
  const [texts, setTexts] = useState();
  const [visuals, setVisuals] = useState();
  const [filteredTexts, setFilteredTexts] = useState();
  const [filteredVisuals, setFilteredVisuals] = useState();
  const [timelineDates, setTimelineDates] = useState({});
  const [resultToDateMapping, setResultToDateMapping] = useState({});
  const [mapMarkers, setMapMarkers] = useState([]);
  const [showingAllTexts, setShowingAllTexts] = useState(false);
  const [showingAllVisuals, setShowingAllVisuals] = useState(false);

  const updateTimelineWithResults = (results) => {
    if (!Array.isArray(results)) return;

    // Map dates into a `{ "id": "date" }` object to prevent duplicates
    // when loading additional results
    const resultToDate = results.reduce((acc, result) => {
      acc[result['@id']] = []
        .concat(result.time)
        .map((time) => time?.begin)
        .filter((x) => x);
      return acc;
    }, resultToDateMapping);
    setResultToDateMapping(resultToDate);

    const newTimelineDates = Object.values(resultToDate)
      .flat()
      .reduce((acc, cur) => {
        const rounded = Math.floor(cur / TIMELINE_INTERVAL) * TIMELINE_INTERVAL;
        acc[rounded] = (acc[rounded] || 0) + 1;
        return acc;
      }, {});

    setTimelineDates(newTimelineDates);
  };

  const updateMapMarkersWithResults = (results) => {
    if (!Array.isArray(results)) return;

    const targetDate = parseInt(query.date, 10);

    setMapMarkers((prevMarkers) => {
      const flatMarkers = [
        ...prevMarkers,
        ...results
          .filter((result) => filterItemWithDate(result, targetDate))
          .map((result) =>
            []
              .concat(result.source?.createdLocation, result.source?.location)
              .map((loc) => loc && { id: result['@id'], lat: loc.lat, long: loc.long })
              .filter((x) => x)
          )
          .flat(),
      ];

      return [...new Set(Object.values(flatMarkers))];
    });
  };

  useEffect(() => {
    if (!result) return;

    const q = {
      id: result['@id'],
      type: query.type,
      locale: i18n.language,
    };
    const qs = queryString.stringify(q);

    setMapMarkers([]);

    (async () => {
      const results = await (
        await fetch(`${absoluteUrl(req)}/api/odeuropa/vocabulary-wordcloud?${qs}`)
      ).json();
      setWordCloud(
        results.error
          ? null
          : results.map((word) => ({
              value: word,
              count: Math.random(),
            }))
      );
    })();

    (async () => {
      const { results } = await (
        await fetch(`${absoluteUrl(req)}/api/odeuropa/vocabulary-texts?${qs}`)
      ).json();
      setTexts(results.error ? null : results);
      updateTimelineWithResults(results);
      updateMapMarkersWithResults(results);
    })();

    (async () => {
      const { results } = await (
        await fetch(`${absoluteUrl(req)}/api/odeuropa/vocabulary-visuals?${qs}`)
      ).json();
      setVisuals(results.error ? null : results);
      updateTimelineWithResults(results);
      updateMapMarkersWithResults(results);
    })();
  }, [result]);

  useEffect(() => {
    if (!texts) return;
    if (!query.date) {
      setFilteredTexts(texts);
      return;
    }
    const targetDate = parseInt(query.date, 10);
    setFilteredTexts(texts.filter((item) => filterItemWithDate(item, targetDate)));
  }, [texts, query]);

  useEffect(() => {
    if (!visuals) return;
    if (!query.date) {
      setFilteredVisuals(visuals);
      return;
    }
    const targetDate = parseInt(query.date, 10);
    setFilteredVisuals(visuals.filter((item) => filterItemWithDate(item, targetDate)));
  }, [visuals, query]);

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

  const pageTitle = getEntityMainLabel(result, { route, language: i18n.language });

  const related = (Array.isArray(result.related) ? result.related : [result.related]).filter(
    (x) => x
  );

  const cardRoute = config.routes[route.details.route];

  return (
    <Layout>
      <PageTitle title={`${pageTitle}`} />
      <Header />
      <Body>
        <Element>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '1em' }}>
            <div style={{ marginRight: '2em' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(
                  result.image,
                  `/images/odeuropa-vocabularies/placeholder_${query.type}.png`
                )}
                alt=""
                width="300"
                height="180"
                style={{ objectFit: 'cover' }}
              />
            </div>

            <div
              style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', color: 'gray', fontWeight: 'bold' }}>
                {t('project:odeuropa-vocabulary-details.smellOf')}
              </div>
              <div
                style={{
                  fontSize: '5rem',
                  color: '#725cae',
                  fontWeight: 'bold',
                  lineHeight: '4.5rem',
                }}
              >
                {pageTitle}
              </div>
            </div>

            {related.length > 0 && (
              <div
                style={{
                  flex: '1 1 300px',
                  display: 'flex',
                  flexDirection: 'column',
                  marginLeft: 'auto',
                  marginRight: '1em',
                  marginTop: '2.5em',
                  textAlign: 'right',
                }}
              >
                <div style={{ textTransform: 'uppercase', color: 'gray', fontWeight: 'bold' }}>
                  {t('project:odeuropa-vocabulary-details.related')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {related.map((rel, i) => (
                    <>
                      <Link
                        key={rel['@id']}
                        href={`/details/${route.details.view}?id=${encodeURIComponent(
                          uriToId(rel['@id'], {
                            base: route.uriBase,
                          })
                        )}&type=${query.type}`}
                        passHref
                      >
                        <a style={{ fontWeight: 'bold' }}>
                          <span style={{ margin: '0 1em' }}>{rel.label}</span>
                        </a>
                      </Link>
                      {i < related.length - 1 && <>&middot;</>}
                    </>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Element>

        {Object.keys(timelineDates).length > 0 && (
          <OdeuropaTimeline
            values={timelineDates}
            interval={TIMELINE_INTERVAL}
            minValue={1300}
            maxValue={2000}
            onChange={(date) => {
              router.push({
                query: {
                  ...query,
                  date,
                },
              });
            }}
            defaultValue={query.date}
          />
        )}

        <Element display="flex" alignItems="center" padding="1em">
          {typeof wordCloud === 'undefined' && (
            <Element display="flex" alignItems="center" paddingRight="1em">
              <Spinner size="24" style={{ marginRight: '0.5em' }} />{' '}
              {t('project:odeuropa-vocabulary-details.wordCloud.loading')}
            </Element>
          )}
          {wordCloud === null && (
            <span style={{ color: 'red', paddingRight: '1em' }}>
              {t('project:odeuropa-vocabulary-details.wordCloud.error')}
            </span>
          )}
          {wordCloud?.length > 0 && (
            <Element
              display="flex"
              justifyContent="center"
              width="25%"
              height="100%"
              paddingRight="1em"
              style={{ textAlign: 'center' }}
            >
              <TagCloud minSize={12} maxSize={35} tags={wordCloud} />
            </Element>
          )}

          {mapMarkers.length > 0 && (
            <Element flex="1" height={500}>
              <OdeuropaMap
                markers={mapMarkers}
                popupContentWrapperStyle={{
                  background: 'none',
                  boxShadow: 'none',
                }}
                renderPopup={(marker) => {
                  const result = []
                    .concat(visuals, texts)
                    .filter((x) => x)
                    .find((result) => result['@id'] === marker.id);

                  if (!result) return null;

                  const [, targetRoute] = findRouteByRDFType(result['@type']);
                  if (!targetRoute) return null;

                  return (
                    <OdeuropaCard
                      key={result['@id']}
                      item={result}
                      route={targetRoute}
                      type={route.details.route}
                      searchApi="/api/search"
                    />
                  );
                }}
              />
            </Element>
          )}
        </Element>

        <Element style={{ padding: '1em', color: 'gray' }}>
          {typeof texts === 'undefined' && (
            <Element display="flex" alignItems="center">
              <Spinner size="24" style={{ marginRight: '0.5em' }} />{' '}
              {t('project:odeuropa-vocabulary-details.texts.loading')}
            </Element>
          )}
          {texts === null && (
            <span style={{ color: 'red' }}>
              {t('project:odeuropa-vocabulary-details.texts.error')}
            </span>
          )}
          {filteredTexts && (
            <h2>
              {t('project:odeuropa-vocabulary-details.texts.title')} (
              {t('project:odeuropa-vocabulary-details.occurrences', {
                count: filteredTexts.length,
              })}
              )
            </h2>
          )}
        </Element>

        {filteredTexts && (
          <>
            <Results showAll={showingAllTexts}>
              {filteredTexts.map((item) => (
                <Result key={item['@id']}>
                  <OdeuropaCard
                    item={item}
                    route={cardRoute}
                    type={route.details.route}
                    searchApi="/api/odeuropa/vocabulary-texts"
                  />
                </Result>
              ))}
            </Results>
            {filteredTexts.length > 4 && (
              <ShowMore
                active={showingAllTexts}
                onClick={() => setShowingAllTexts((show) => !show)}
              >
                <div>
                  {showingAllTexts
                    ? t('project:odeuropa-vocabulary-details.showLess')
                    : t('project:odeuropa-vocabulary-details.showMore')}
                  <ShowMoreIcon as={showingAllTexts ? ChevronUp : ChevronDown} />
                </div>
              </ShowMore>
            )}
          </>
        )}

        <Element style={{ padding: '1em', color: 'gray' }}>
          {typeof visuals === 'undefined' && (
            <Element display="flex" alignItems="center">
              <Spinner size="24" style={{ marginRight: '0.5em' }} />{' '}
              {t('project:odeuropa-vocabulary-details.visuals.loading')}
            </Element>
          )}
          {visuals === null && (
            <span style={{ color: 'red' }}>
              {t('project:odeuropa-vocabulary-details.visuals.error')}
            </span>
          )}
          {filteredVisuals && (
            <h2>
              {t('project:odeuropa-vocabulary-details.visuals.title')} (
              {t('project:odeuropa-vocabulary-details.occurrences', {
                count: filteredVisuals.length,
              })}
              )
            </h2>
          )}
        </Element>

        {filteredVisuals && (
          <>
            <Results showAll={showingAllVisuals}>
              {filteredVisuals.map((item) => (
                <Result key={item['@id']} style={{ margin: '0 1em' }}>
                  <OdeuropaCard
                    item={item}
                    route={cardRoute}
                    type={route.details.route}
                    searchApi="/api/odeuropa/vocabulary-visuals"
                  />
                </Result>
              ))}
            </Results>
            {filteredVisuals.length > 4 && (
              <ShowMore
                active={showingAllVisuals}
                onClick={() => setShowingAllVisuals((show) => !show)}
              >
                <div>
                  {showingAllVisuals
                    ? t('project:odeuropa-vocabulary-details.showLess')
                    : t('project:odeuropa-vocabulary-details.showMore')}
                  <ShowMoreIcon as={showingAllVisuals ? ChevronUp : ChevronDown} />
                </div>
              </ShowMore>
            )}
          </>
        )}

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
      </Body>
      <Footer />
    </Layout>
  );
};

export async function getServerSideProps({ req, res, query, locale }) {
  const {
    result = null,
    inList = false,
    debugSparqlQuery = null,
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

export default OdeuropaVocabularyDetailsPage;
