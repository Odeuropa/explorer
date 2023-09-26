import { Fragment, useEffect, useState } from 'react';
import Image from 'next/image';
import styled from 'styled-components';
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
import { uriToId } from '@helpers/utils';
import { getEntityMainLabel } from '@helpers/explorer';
import { getEntity, getEntityDebugQuery } from '@pages/api/entity';
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

const ShowMore = styled.a`
  display: flex;
  flex-direction: row;
  cursor: pointer;
  position: relative;
  margin: 2em;
  text-transform: uppercase;
  text-decoration: none;

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

const WordCloudsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 1em;
  text-align: center;
  gap: 1em;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const TIMELINE_INTERVAL = 20; // years

const filterItemWithDates = (item, targetDates) => {
  if (!Array.isArray(targetDates) || targetDates.length === 0) return true;
  const time = [].concat(item.time).filter((x) => x)[0];
  const timeBegin = parseInt(time?.begin, 10);
  return targetDates.some(
    (targetDate) => timeBegin >= targetDate && timeBegin < targetDate + TIMELINE_INTERVAL
  );
};

const filterItemWithTag = (item, targetTag) => {
  if (!targetTag) return true;
  return [].concat(item.adjective).includes(targetTag);
};

const formatWordCloudData = (results) => {
  const minFontSize = 16;
  const maxFontSize = 48;

  const minCount = Math.min(...Object.values(results));
  const maxCount = Math.max(...Object.values(results));

  return Object.entries(results).map(([key, value]) => {
    const fontSize =
      Math.sqrt((value - minCount) / (maxCount - minCount)) * (maxFontSize - minFontSize) +
      minFontSize;

    return {
      key,
      value: key,
      count: value,
      props: {
        style: {
          fontSize,
        },
      },
    };
  });
};

const OdeuropaVocabularyDetailsPage = ({ result, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { query } = router;
  const route = config.routes[query.type];
  const [wordCloud, setWordCloud] = useState({
    quality: undefined,
    emotion: undefined,
    smellscape: undefined,
  });
  const [texts, setTexts] = useState();
  const [visuals, setVisuals] = useState();
  const [wordCloudDebug, setWordCloudDebug] = useState({});
  const [textsCount, setTextsCount] = useState(0);
  const [visualsCount, setVisualsCount] = useState(0);
  const [textsDebug, setTextsDebug] = useState();
  const [visualsDebug, setVisualsDebug] = useState();
  const [filteredTexts, setFilteredTexts] = useState();
  const [filteredVisuals, setFilteredVisuals] = useState();
  const [favorites, setFavorites] = useState([]);
  const [timelineDates, setTimelineDates] = useState({});
  const [resultToDateMapping, setResultToDateMapping] = useState({});
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

  useEffect(() => {
    if (!result) return;

    const q = {
      id: result['@id'],
      type: query.type,
      date: query.date,
      tag: query.tag,
      locale: i18n.language,
    };
    const qs = queryString.stringify(q);

    (async () => {
      for (const cloud of Object.keys(wordCloud)) {
        const wordCloudRes = await (
          await fetch(
            `${window.location.origin}/api/odeuropa/vocabulary-wordcloud?cloud=${cloud}&${qs}`
          )
        ).json();
        setWordCloudDebug((prev) => ({
          ...prev,
          [cloud]: wordCloudRes.debugSparqlQuery,
        }));
        setWordCloud((prev) => ({
          ...prev,
          [cloud]: wordCloudRes.error ? null : formatWordCloudData(wordCloudRes.results),
        }));
      }
    })();

    (async () => {
      const { results, favorites, totalResults, debugSparqlQuery } = await (
        await fetch(`${window.location.origin}/api/odeuropa/vocabulary-texts?${qs}`)
      ).json();
      if (results) {
        setTexts(results.error ? null : results);
        setTextsDebug(debugSparqlQuery);
        setTextsCount(totalResults);
        setFavorites((prev) => [...new Set([...prev, ...favorites])]);
        updateTimelineWithResults(results);
      }
    })();

    (async () => {
      const { results, favorites, totalResults, debugSparqlQuery } = await (
        await fetch(`${window.location.origin}/api/odeuropa/vocabulary-visuals?${qs}`)
      ).json();
      if (results) {
        setVisuals(results.error ? null : results);
        setVisualsDebug(debugSparqlQuery);
        setVisualsCount(totalResults);
        setFavorites((prev) => [...new Set([...prev, ...favorites])]);
        updateTimelineWithResults(results);
      }
    })();
  }, [result]);

  useEffect(() => {
    if (!texts) return;
    if (!query.date && !query.tag) {
      setFilteredTexts(texts);
      return;
    }
    const targetDates = (query.date || '')
      .split(',')
      .map((date) => parseInt(date, 10))
      .filter((x) => x);
    setFilteredTexts(
      texts.filter(
        (item) => filterItemWithDates(item, targetDates) && filterItemWithTag(item, query.tag)
      )
    );
  }, [texts, query]);

  useEffect(() => {
    if (!visuals) return;
    if (!query.date) {
      setFilteredVisuals(visuals);
      return;
    }
    const targetDates = query.date
      .split(',')
      .map((date) => parseInt(date, 10))
      .filter((x) => x);
    setFilteredVisuals(visuals.filter((item) => filterItemWithDates(item, targetDates)));
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
              <Image
                src={getImageUrl(
                  result.image,
                  `/images/odeuropa-vocabularies/placeholder_${query.type}.png`
                )}
                alt=""
                width={300}
                height={180}
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
                    <Fragment key={rel['@id']}>
                      <Link
                        href={`/${query.type}/${encodeURIComponent(
                          uriToId(rel['@id'], {
                            base: route.uriBase,
                          })
                        )}`}
                        style={{ fontWeight: 'bold' }}
                      >
                        <span style={{ margin: '0 1em' }}>{rel.label}</span>
                      </Link>
                      {i < related.length - 1 && <>&middot;</>}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Element>

        {Object.keys(timelineDates).length > 0 && (
          <OdeuropaTimeline
            options={timelineDates}
            interval={TIMELINE_INTERVAL}
            minValue={1300}
            maxValue={2000}
            onChange={(dates) => {
              const newQuery = { ...query };
              if (dates.length > 0) {
                newQuery.date = dates.join(',');
              } else {
                delete newQuery.date;
              }
              // Remove previous tag as it migh not exist anymore
              delete newQuery.tag;
              router.push({ pathname: router.asPath.split('?')[0], query: newQuery }, undefined, {
                scroll: false,
              });
            }}
            defaultValues={query.date?.split(',') || []}
          />
        )}

        <WordCloudsContainer>
          {Object.keys(wordCloud).map((cloud) => (
            <Element
              key={cloud}
              style={{ maxWidth: '50%', width: `${100 / Object.keys(wordCloud).length}%` }}
            >
              <h3>{t(`project:odeuropa-vocabulary-details.wordCloud.title.${cloud}`)}</h3>
              {typeof wordCloud[cloud] === 'undefined' && (
                <Element
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  paddingRight="1em"
                >
                  <Spinner size="24" style={{ marginRight: '0.5em' }} />{' '}
                  {t('project:odeuropa-vocabulary-details.wordCloud.loading')}
                </Element>
              )}
              {wordCloud[cloud] === null && (
                <span style={{ color: 'red', paddingRight: '1em' }}>
                  {t('project:odeuropa-vocabulary-details.wordCloud.error')}
                </span>
              )}
              {wordCloud[cloud]?.length > 0 && (
                <Element
                  display="flex"
                  justifyContent="center"
                  height="100%"
                  paddingRight="1em"
                  style={{ textAlign: 'center' }}
                >
                  <TagCloud
                    minSize={24}
                    maxSize={48}
                    tags={wordCloud[cloud]}
                    randomSeed={42}
                    colorOptions={{
                      luminosity: 'bright',
                    }}
                  />
                </Element>
              )}
            </Element>
          ))}
        </WordCloudsContainer>
        <Element display="flex" flexDirection="row" alignItems="center" paddingX="1em">
          {Object.keys(wordCloud).map((cloud) => (
            <Debug key={wordCloud}>
              <Metadata label="SPARQL Query">
                <SPARQLQueryLink query={wordCloudDebug[cloud]}>
                  {t('common:buttons.editQuery')}
                </SPARQLQueryLink>
                <pre>{wordCloudDebug[cloud]}</pre>
              </Metadata>
            </Debug>
          ))}
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
                count: textsCount,
              })}
              )
            </h2>
          )}
          <Debug>
            <Metadata label="Query Result">
              <pre>{JSON.stringify(texts, null, 2)}</pre>
            </Metadata>
            <Metadata label="SPARQL Query">
              <SPARQLQueryLink query={textsDebug}>{t('common:buttons.editQuery')}</SPARQLQueryLink>
              <pre>{textsDebug}</pre>
            </Metadata>
          </Debug>
        </Element>

        {filteredTexts && (
          <>
            <Results showAll={showingAllTexts}>
              {filteredTexts.slice(0, showingAllTexts ? undefined : 5).map((item) => (
                <Result key={item['@id']}>
                  <OdeuropaCard
                    item={item}
                    route={cardRoute}
                    type={route.details.route}
                    searchApi="/api/odeuropa/vocabulary-texts"
                    isFavorite={favorites.includes(item['@id'])}
                    onToggleFavorite={(saved) => {
                      setFavorites((prev) =>
                        saved ? [...prev, item['@id']] : prev.filter((id) => id !== item['@id'])
                      );
                    }}
                  />
                </Result>
              ))}
            </Results>
            {filteredTexts.length > 4 && (
              <ShowMore
                active={showingAllTexts}
                href={
                  route.plugins['odeuropa-vocabulary'].texts.showAllFilter
                    ? `/smells?filter_type=text&filter_${
                        route.plugins['odeuropa-vocabulary'].texts.showAllFilter
                      }=${encodeURIComponent(result['@id'])}`
                    : ''
                }
                onClick={() =>
                  !route.plugins['odeuropa-vocabulary'].texts.showAllFilter &&
                  setShowingAllTexts((show) => !show)
                }
              >
                <div>
                  {showingAllTexts
                    ? t('project:odeuropa-vocabulary-details.showLess')
                    : t('project:odeuropa-vocabulary-details.showMore')}
                  {!route.plugins['odeuropa-vocabulary'].texts.showAllFilter && (
                    <ShowMoreIcon as={showingAllTexts ? ChevronUp : ChevronDown} />
                  )}
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
                count: visualsCount,
              })}
              )
            </h2>
          )}

          <Debug>
            <Metadata label="Query Result">
              <pre>{JSON.stringify(visuals, null, 2)}</pre>
            </Metadata>
            <Metadata label="SPARQL Query">
              <SPARQLQueryLink query={visualsDebug}>
                {t('common:buttons.editQuery')}
              </SPARQLQueryLink>
              <pre>{visualsDebug}</pre>
            </Metadata>
          </Debug>
        </Element>

        {filteredVisuals && (
          <>
            <Results showAll={showingAllVisuals}>
              {filteredVisuals.slice(0, showingAllVisuals ? undefined : 5).map((item) => (
                <Result key={item['@id']} style={{ margin: '0 1em' }}>
                  <OdeuropaCard
                    item={item}
                    route={cardRoute}
                    type={route.details.route}
                    searchApi="/api/odeuropa/vocabulary-visuals"
                    isFavorite={favorites.includes(item['@id'])}
                    onToggleFavorite={(saved) => {
                      setFavorites((prev) =>
                        saved ? [...prev, item['@id']] : prev.filter((id) => id !== item['@id'])
                      );
                    }}
                  />
                </Result>
              ))}
            </Results>
            {filteredVisuals.length > 4 && (
              <ShowMore
                active={showingAllVisuals}
                href={
                  route.plugins['odeuropa-vocabulary'].visuals.showAllFilter
                    ? `/smells?filter_type=image&filter_${
                        route.plugins['odeuropa-vocabulary'].texts.showAllFilter
                      }=${encodeURIComponent(result['@id'])}`
                    : ''
                }
                onClick={() =>
                  !route.plugins['odeuropa-vocabulary'].visuals.showAllFilter &&
                  setShowingAllVisuals((show) => !show)
                }
              >
                <div>
                  {showingAllVisuals
                    ? t('project:odeuropa-vocabulary-details.showLess')
                    : t('project:odeuropa-vocabulary-details.showMore')}
                  {!route.plugins['odeuropa-vocabulary'].visuals.showAllFilter && (
                    <ShowMoreIcon as={showingAllVisuals ? ChevronUp : ChevronDown} />
                  )}
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

export async function getServerSideProps({ res, query, locale }) {
  const result = await getEntity(query, locale);
  const debugSparqlQuery = await getEntityDebugQuery(query, locale);

  if (!result && res) {
    res.statusCode = 404;
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'project', 'search'])),
      result,
      debugSparqlQuery,
    },
  };
}

export default OdeuropaVocabularyDetailsPage;
