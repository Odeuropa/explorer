import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import 'react-18-image-lightbox/style.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { TagCloud } from 'react-tagcloud';

import NotFoundPage from '@pages/404';
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
import { absoluteUrl, slugify, uriToId } from '@helpers/utils';
import { getEntityMainLabel } from '@helpers/explorer';
import AppContext from '@helpers/context';
import { useTranslation } from 'next-i18next';
import config from '~/config';

const Results = styled.div`
  --visible-cols: 4;
  --col-gap: 20px;
  --col-hint: 20px;
  --scrollbar-padding: 20px;
  --col-size: calc((100% / var(--visible-cols)) - var(--col-gap) - var(--col-hint));

  display: grid;
  grid-auto-flow: column;
  grid-template-columns: var(--col-size);
  grid-auto-columns: var(--col-size);
  overflow-x: auto;
  overflow-y: hidden;
  grid-gap: var(--col-gap);
`;

const Result = styled.div`
  padding: 1em;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const OdeuropaVocabularyDetailsPage = ({ result, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const { req, query } = useRouter();
  const route = config.routes[query.type];
  const [wordCloud, setWordCloud] = useState();
  const [texts, setTexts] = useState();
  const [visuals, setVisuals] = useState();
  const { setSearchData, setSearchQuery, setSearchPath } = useContext(AppContext);

  useEffect(() => {
    if (!result) return;

    const q = {
      id: result['@id'],
      type: query.type,
      locale: i18n.language,
    };
    const qs = queryString.stringify(q);

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
      const results = await (
        await fetch(`${absoluteUrl(req)}/api/odeuropa/vocabulary-texts?${qs}`)
      ).json();
      setTexts(results.error ? null : results);
    })();

    (async () => {
      const results = await (
        await fetch(`${absoluteUrl(req)}/api/odeuropa/vocabulary-visuals?${qs}`)
      ).json();
      setVisuals(results.error ? null : results);
    })();
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
          <div style={{ display: 'flex', padding: '1em' }}>
            <div style={{ marginRight: '2em' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image || `/images/odeuropa-vocabularies/placeholder_${query.type}.png`}
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
                  display: 'flex',
                  flexDirection: 'column',
                  marginLeft: 'auto',
                  marginRight: '1em',
                  marginTop: '2.5em',
                  width: 300,
                  textAlign: 'right',
                }}
              >
                <div style={{ textTransform: 'uppercase', color: 'gray', fontWeight: 'bold' }}>
                  {t('project:odeuropa-vocabulary-details.related')}
                </div>
                <div>
                  {related.map((rel, i) => (
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
                        {i < related.length - 1 && <>&middot;</>}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Element>

        <Element style={{ padding: '1em', width: 350, textAlign: 'center' }}>
          {typeof wordCloud === 'undefined' && (
            <Element display="flex" alignItems="center">
              <Spinner size="24" style={{ marginRight: '0.5em' }} />{' '}
              {t('project:odeuropa-vocabulary-details.wordCloud.loading')}
            </Element>
          )}
          {wordCloud === null && (
            <span style={{ color: 'red' }}>
              {t('project:odeuropa-vocabulary-details.wordCloud.error')}
            </span>
          )}
          {wordCloud && <TagCloud minSize={8} maxSize={35} tags={wordCloud} />}
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
          {texts && (
            <h2>
              {t('project:odeuropa-vocabulary-details.texts.title')} (
              {t('project:odeuropa-vocabulary-details.occurrences', { count: texts.length })})
            </h2>
          )}
        </Element>

        {texts && (
          <Results>
            {texts.map((item) => (
              <Result key={item['@id']} style={{ margin: '0 1em' }}>
                <OdeuropaCard
                  item={item}
                  route={cardRoute}
                  type={route.details.route}
                  onSeeMore={() => {
                    setSearchQuery(query);
                    setSearchPath(window.location.pathname);
                    setSearchData({
                      totalResults: texts.length,
                      results: texts,
                    });
                  }}
                />
              </Result>
            ))}
          </Results>
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
          {visuals && (
            <h2>
              {t('project:odeuropa-vocabulary-details.visuals.title')} (
              {t('project:odeuropa-vocabulary-details.occurrences', { count: visuals.length })})
            </h2>
          )}
        </Element>

        {visuals && (
          <Results>
            {visuals.map((item) => (
              <Result key={item['@id']} style={{ margin: '0 1em' }}>
                <OdeuropaCard
                  item={item}
                  route={config.routes.visuals}
                  type="visuals"
                  onSeeMore={() => {
                    setSearchQuery(query);
                    setSearchPath(window.location.pathname);
                    setSearchData({
                      totalResults: visuals.length,
                      results: visuals,
                    });
                  }}
                />
              </Result>
            ))}
          </Results>
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
