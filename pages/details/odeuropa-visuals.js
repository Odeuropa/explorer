import { Fragment, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import NextAuth from 'next-auth/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import 'react-image-lightbox/style.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

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
import { useTranslation } from 'next-i18next';
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

const OdeuropaVisualPage = ({ result, inList, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { query } = router;
  const [session] = NextAuth.useSession();
  const route = config.routes[query.type];

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

  const pageTitle = getEntityMainLabel(result, { route, language: i18n.language });

  const [isItemSaved, setIsItemSaved] = useState(inList);
  const onItemSaveChange = (status) => {
    setIsItemSaved(status);
  };

  return (
    <Layout>
      <PageTitle title={`${pageTitle}`} />
      <Header />
      <Body>
        <Columns>
          <Primary>
            <Element>
              <Element style={{ fontSize: '2rem', color: 'gray', fontWeight: 'bold', marginBottom: '1rem' }}>
                Visual resource
              </Element>

              <Element style={{ fontSize: '4rem', color: '#725cae', fontWeight: 'bold', lineHeight: '100%' }}>
                {result.label}
              </Element>

              <Element
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                {result.sameAs && (
                  <small>
                    (
                      <a href={result.sameAs} target="_blank" rel="noopener noreferrer">
                        {t('common:buttons.original')}
                      </a>
                    )
                  </small>
                )}
                {route.details.showPermalink && (
                  <small>
                    (
                    <a href={generatePermalink(result['@id'])} target="_blank" rel="noopener noreferrer">
                      {t('common:buttons.permalink')}
                    </a>
                    )
                  </small>
                )}
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
                <GraphLink uri={result['@graph']} icon label />
              </Element>
            </Element>

            <Element>
              <img src={result.image} alt="" />
            </Element>

            <Separator />

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

export default OdeuropaVisualPage;
