import { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import Lightbox from 'react-18-image-lightbox';
import 'react-18-image-lightbox/style.css';
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
import OdeuropaPagination from '@components/OdeuropaPagination';
import SPARQLQueryLink from '@components/SPARQLQueryLink';
import GraphLink from '@components/GraphLink';
import MetadataList from '@components/MetadataList';
import SaveButton from '@components/SaveButton';
import breakpoints from '@styles/breakpoints';
import { getEntityMainLabel, generatePermalink } from '@helpers/explorer';
import { generateMediaUrl } from '@helpers/utils';
import config from '~/config';

const Columns = styled.div`
  display: flex;
  width: 100%;
  margin: 0 auto;
  flex-direction: column;
  margin-bottom: 24px;

  ${breakpoints.desktop`
    flex-direction: row;
  `}
`;

const Primary = styled.div`
  display: flex;
  flex-direction: column;
`;

const Secondary = styled.div`
  flex: auto;
  padding: 0 24px;

  ${breakpoints.desktop`
    margin-left: 0;
  `}
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

const OdeuropaVisualPage = ({ result, inList, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { query } = router;
  const { data: session } = useSession();
  const route = config.routes[query.type];
  const [isItemSaved, setIsItemSaved] = useState(inList);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxIsOpen, setLightboxIsOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const showLightbox = (index) => {
    setLightboxIndex(Math.min(images.length - 1, Math.max(0, index)));
    setLightboxIsOpen(true);
  };

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

  const onItemSaveChange = (status) => {
    setIsItemSaved(status);
  };

  const images = [].concat(result.image).filter((x) => x);

  return (
    <Layout>
      <PageTitle title={`${pageTitle}`} />
      <Header />
      <Body>
        <Element paddingX={48} paddingY={24}>
          <Element>
            <Element
              style={{
                fontSize: '2rem',
                color: 'gray',
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              Visual resource
            </Element>

            <Element
              style={{
                fontSize: '4rem',
                color: '#725cae',
                fontWeight: 'bold',
                lineHeight: '100%',
              }}
            >
              {result.label}
            </Element>

            <Element display="flex" alignItems="center" justifyContent="space-between">
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
                  <a
                    href={generatePermalink(result['@id'])}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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

          <Columns>
            <Primary>
              {lightboxIsOpen && (
                <Lightbox
                  mainSrc={images[lightboxIndex]}
                  nextSrc={images[(lightboxIndex + 1) % images.length]}
                  prevSrc={images[(lightboxIndex + images.length - 1) % images.length]}
                  onCloseRequest={() => setLightboxIsOpen(false)}
                  onMovePrevRequest={() =>
                    setLightboxIndex((lightboxIndex + images.length - 1) % images.length)
                  }
                  onMoveNextRequest={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                />
              )}

              <OdeuropaPagination result={result} />

              <Element>
                <img src={images[0]} alt="" />
              </Element>
            </Primary>
            <Secondary>
              <Element marginBottom={24}>
                <MetadataList metadata={result} query={query} route={route} />
              </Element>
            </Secondary>
          </Columns>

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
      ...(await serverSideTranslations(locale, ['common', 'project', 'search'])),
      result,
      inList,
      debugSparqlQuery,
    },
  };
}

export default OdeuropaVisualPage;
