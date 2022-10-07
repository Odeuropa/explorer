import { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import Lightbox from 'react-18-image-lightbox';
import 'react-18-image-lightbox/style.css';
import { Carousel } from 'react-responsive-carousel';
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

const CarouselContainer = styled.div`
  .carousel-root {
    display: flex;
  }
  .carousel {
    &.carousel-slider {
      min-height: 50vh;
    }
    .thumbs {
      /* For vertical thumbs */
      display: flex;
      flex-direction: column;
      transform: none !important;
    }
    .thumbs-wrapper {
      overflow: visible;
      margin-top: 0;
      margin-bottom: 0;

      .control-arrow {
        display: none;
      }
    }
    .thumb {
      width: 80px;
      height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #fff;

      &.selected,
      &:hover {
        border: 3px solid ${({ theme }) => theme.colors.primary};
      }

      img {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
      }
    }

    .slide {
      display: flex;
      .legend {
        transition: background-color 0.5s ease-in-out;
        background-color: rgba(0, 0, 0, 0.25);
        color: #fff;
        opacity: 1;

        &:hover {
          background-color: #000;
        }
      }

      .subtitle {
        white-space: pre-line;
        text-align: left;
        padding: 0.5em 1em;
      }

      img {
        width: auto;
        max-height: 50vh;
        pointer-events: auto;
      }
    }

    .carousel-status {
      font-size: inherit;
      color: #fff;
      top: 16px;
      left: 16px;
    }

    .control-arrow::before {
      border-width: 0 3px 3px 0;
      border: solid #000;
      display: inline-block;
      padding: 3px;
      border-width: 0 3px 3px 0;
      width: 20px;
      height: 20px;
    }
    .control-next.control-arrow::before {
      transform: rotate(-45deg);
    }
    .control-prev.control-arrow::before {
      transform: rotate(135deg);
    }

    .slider-wrapper {
      display: flex;
      flex-wrap: wrap;
      height: 100%;
    }
  }
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

              {images.length > 1 && (
                <CarouselContainer>
                  <Carousel showArrows {...config.gallery.options} onChange={setCurrentSlide}>
                    {images.map((image, i) => (
                      <div key={image} onClick={() => showLightbox(i)} aria-hidden="true">
                        <img src={generateMediaUrl(image, 1024)} alt="" />
                      </div>
                    ))}
                  </Carousel>
                </CarouselContainer>
              )}
              {images.length === 1 && (
                <Element>
                  <img src={images[0]} alt="" />
                </Element>
              )}
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
