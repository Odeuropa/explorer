import { useRouter } from 'next/router';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import queryString from 'query-string';
import 'react-image-lightbox/style.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { TagCloud } from 'react-tagcloud';

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
import { slugify, uriToId } from '@helpers/utils';
import { getEntityMainLabel } from '@helpers/explorer';
import { useTranslation } from 'next-i18next';
import config from '~/config';

const OdeuropaVocabularyDetailsPage = ({ result, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const { query } = router;
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

  const related = (Array.isArray(result.related) ? result.related : [result.related]).filter(x => x)

  const adjectives = (Array.isArray(result.adjective) ? result.adjective : [result.adjective]).filter(x => x)
  const tags = adjectives.map(adj => ({
    value: adj,
    count: Math.random()
  }))

  return (
    <Layout>
      <PageTitle title={`${pageTitle}`} />
      <Header />
      <Body>
        <Element>
          <div style={{ display: 'flex', padding: '1em' }}>
            <div style={{ marginRight: '2em' }}>
              <img src={`/images/odeuropa-vocabularies/${query.type}/${slugify(result['@id'])}.jpg`} alt="" width="300" height="180" style={{ objectFit: 'cover' }} onLoad={(event) => { event.target.style.display = 'inline-block' }} onError={(event) => { event.target.style.display = 'none' }} />
            </div>

            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'gray', fontWeight: 'bold' }}>Smell of</div>
              <div style={{ fontSize: '5rem', color: '#725cae', fontWeight: 'bold', lineHeight: '4.5rem' }}>{result.label}</div>
            </div>

            {related.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 'auto', marginRight: '1em', marginTop: '2.5em', width: 300, textAlign: 'right' }}>
                <div style={{ textTransform: 'uppercase', color: 'gray', fontWeight: 'bold' }}>
                  Related
                </div>
                <div>
                  {related.map((rel, i) => (
                    <Link key={rel['@id']} href={`/details/${route.details.view}?id=${encodeURIComponent(
                      uriToId(rel['@id'], {
                        base: route.uriBase,
                      })
                    )}&type=${query.type}`} passHref>
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
          <TagCloud
            minSize={8}
            maxSize={35}
            tags={tags}
          />
        </Element>

        {result.items?.length > 0 && (
          <Element style={{ padding: '1em', color: 'gray' }}>
            <h2>In texts ({result.items.length} occurrences)</h2>
          </Element>
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

export default OdeuropaVocabularyDetailsPage;
