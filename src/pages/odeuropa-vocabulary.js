import styled from 'styled-components';
import { useRouter } from 'next/router';
import Link from 'next/link';
import 'intersection-observer';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Header from '@components/Header';
import Footer from '@components/Footer';
import Layout from '@components/Layout';
import Body from '@components/Body';
import Content from '@components/Content';
import Metadata from '@components/Metadata';
import Debug from '@components/Debug';
import PageTitle from '@components/PageTitle';
import SPARQLQueryLink from '@components/SPARQLQueryLink';
import breakpoints from '@styles/breakpoints';
import SparqlClient from '@helpers/sparql';
import { getQueryObject, uriToId } from '@helpers/utils';
import config from '~/config';

const Hero = styled.div`
  width: 100%;
  height: 220px;
  display: flex;
  color: #fff;
  background-image: ${({ image }) => `url(${image})`};
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;

  ${breakpoints.mobile`
    height: 294px;
  `}

  ${breakpoints.weirdMedium`
    height: 490px;
  `}
`;

const VocabularyTitle = styled.div`
  align-self: flex-end;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  color: #725cae;
  padding-bottom: 2em;

  h1 {
    word-break: break-all;
    font-size: 3rem;
    font-weight: 200;
    line-height: 100%;

    ${breakpoints.mobile`
      font-size: 5rem;
    `}
    ${breakpoints.weirdMedium`
      font-size: 10rem;
    `}
  }

  p {
    font-weight: 200;

    ${breakpoints.mobile`
      font-size: 1rem;
    `}
    ${breakpoints.weirdMedium`
      font-size: 2rem;
    `}
  }
`;

const Results = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, min(400px, 100%));
  grid-gap: 1rem;
  margin: 1rem 0;

  transition: opacity 250ms cubic-bezier(0.23, 1, 0.32, 1) 0s;
  opacity: ${({ loading }) => (loading ? 0.25 : 1)};
  pointer-events: ${({ loading }) => (loading ? 'none' : 'auto')};

  ${breakpoints.weirdMedium`
    margin-left: 120px;
  `}

  a {
    text-decoration: none;
    &:hover {
      color: inherit;
      text-decoration: underline;
    }
  }
`;

const Result = styled.div``;

const Container = styled.div`
  display: flex;
  align-items: baseline;
`;

const Item = styled.div`
  margin-bottom: 24px;
`;

const ItemTitle = styled.div`
  display: flex;
  align-items: center;

  h2:not(:last-child) {
    margin-right: 0.25em;
  }
`;

const OdeuropaVocabularyPage = ({ results, debugSparqlQuery }) => {
  const { t } = useTranslation(['common', 'project']);
  const router = useRouter();

  const query = { ...router.query };
  const route = config.routes[query.type];

  const useWith = [];
  if (route && Array.isArray(route.useWith)) {
    useWith.push(...route.useWith);
  }

  return (
    <Layout>
      <PageTitle title={`${t('common:vocabulary.title')} ${query.type}`} />
      <Header />
      <Body>
        <Hero image={`/images/pages/${query.type}.jpg`}>
          <VocabularyTitle>
            <h1>
              {t(
                `project:routes.${query.type}`,
                query.type.substr(0, 1).toUpperCase() + query.type.substr(1)
              )}
            </h1>
            <p>{t(`project:routes-descriptions.${query.type}`, '')}</p>
          </VocabularyTitle>
        </Hero>
        <Content>
          <Container>
            <Results>
              {results.map((result) => (
                <Result key={result['@id']} id={result['@id']}>
                  <Link
                    href={`/details/${route.details.view}?id=${encodeURIComponent(
                      uriToId(result['@id'], {
                        base: route.uriBase,
                      })
                    )}&type=${query.type}`}
                    passHref
                  >
                    <a>
                      <Item key={result['@id']} id={result['@id']}>
                        <ItemTitle>
                          <h2>{result.label}</h2>
                        </ItemTitle>
                        {result.description && <p>{result.description}</p>}
                      </Item>
                    </a>
                  </Link>
                </Result>
              ))}
            </Results>
          </Container>
          <Debug>
            <Metadata label="HTTP Parameters">
              <pre>{JSON.stringify(query, null, 2)}</pre>
            </Metadata>
            <Metadata label="Query Results">
              <pre>{JSON.stringify(results, null, 2)}</pre>
            </Metadata>
            <Metadata label="Results SPARQL Query">
              <SPARQLQueryLink query={debugSparqlQuery.results}>
                {t('common:buttons.editQuery')}
              </SPARQLQueryLink>
              <pre>{debugSparqlQuery.results}</pre>
            </Metadata>
          </Debug>
        </Content>
      </Body>
      <Footer />
    </Layout>
  );
};

export async function getServerSideProps({ query, locale }) {
  const route = config.routes[query.type];

  const debugSparqlQuery = {};
  const results = [];

  if (route) {
    const mainQuery = getQueryObject(route.query, { language: locale });

    if (config.debug) {
      debugSparqlQuery.results = await SparqlClient.getSparqlQuery(mainQuery);
    }

    // Execute the query
    const res = await SparqlClient.query(mainQuery, {
      endpoint: config.api.endpoint,
      debug: config.debug,
      params: config.api.params,
    });
    if (res) {
      results.push(...res['@graph']);
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'project'])),
      results,
      debugSparqlQuery,
    },
  };
}

export default OdeuropaVocabularyPage;
