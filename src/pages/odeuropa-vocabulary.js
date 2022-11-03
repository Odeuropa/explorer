import { useState, useEffect, useRef } from 'react';
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
import Input from '@components/Input';
import Select from '@components/Select';
import breakpoints from '@styles/breakpoints';
import SparqlClient from '@helpers/sparql';
import { generateMediaUrl, getQueryObject, removeEmptyObjects, uriToId } from '@helpers/utils';
import { getEntityMainLabel } from '@helpers/explorer';
import config from '~/config';
import { selectStyles, selectTheme } from '~/theme';

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
  padding: 0 1em 2em 1em;

  h1 {
    word-break: break-all;
    font-size: 3rem;
    font-weight: 200;
    line-height: 100%;

    ${breakpoints.weirdMedium`
      font-size: 7rem;
    `}
  }

  p {
    text-align: center;
    font-weight: 200;
    padding: 0 1em;

    ${breakpoints.mobile`
      font-size: 1rem;
    `}
    ${breakpoints.weirdMedium`
      font-size: 2rem;
    `}
  }
`;

const StyledSelect = styled(Select)`
  min-width: 200px;
`;

const DateSelect = styled(Select)`
  min-width: 100px;
`;

const Results = styled.div`
  flex: 1;
  justify-content: center;
  display: grid;
  grid-template-columns: repeat(auto-fit, min(300px, 100%));
  grid-gap: 1rem;
  margin: 1rem 0;

  transition: opacity 250ms cubic-bezier(0.23, 1, 0.32, 1) 0s;
  opacity: ${({ loading }) => (loading ? 0.25 : 1)};
  pointer-events: ${({ loading }) => (loading ? 'none' : 'auto')};
`;

const Result = styled.div`
  a {
    text-decoration: none;
    &:hover {
      color: inherit;
      text-decoration: underline;
    }
  }
`;

const Container = styled.div`
  display: flex;
  align-items: baseline;
`;

const Item = styled.div`
  margin-bottom: 24px;
`;

const ItemImage = styled.div`
  width: 300px;
  height: 267px;
  background-color: #e9e9e9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ItemTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  h2:not(:last-child) {
    margin-right: 0.25em;
  }

  span {
    font-size: 1.2rem;
  }
`;

const StyledInput = styled(Input)`
  border: 1px solid #b9d59b;
  border-radius: 20px;
  background-color: #fff;
  padding: 0 16px;

  ::placeholder {
    color: #b9d59b;
  }
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  margin-bottom: 24px;

  ${breakpoints.weirdMedium`
    margin-left: 120px;
    margin-right: 120px;
  `}
`;

export const getImageUrl = (image, placeholder) => {
  if (!image) return placeholder;
  if (
    ['.gif', '.svg', '.tiff'].some((ext) =>
      image.toLocaleLowerCase().trim().endsWith(ext.toLocaleLowerCase().trim())
    )
  )
    return image;
  return generateMediaUrl(image, 300);
};

const OdeuropaVocabularyPage = ({ results, datesFilter, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'search', 'project']);
  const router = useRouter();
  const query = { ...router.query };
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState(query.from);
  const [searchDateTo, setSearchDateTo] = useState(query.to);
  const [searchOrder, setSearchOrder] = useState(query.order);
  const [resultsWithLabel, setResultsWithLabel] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);

  const route = config.routes[query.type];

  useEffect(() => {
    const resultsWithLabel = [];
    if (Array.isArray(results)) {
      results.forEach((item) => {
        resultsWithLabel.push({
          ...item,
          mainLabel: getEntityMainLabel(item, { route, language: i18n.language }),
        });
      });
    }
    resultsWithLabel.sort((a, b) => {
      if (searchOrder === 'count') {
        return b.count - a.count;
      }
      if (!a.mainLabel) return b.mainLabel ? 1 : 0;
      if (!b.mainLabel) return -1;
      return a.mainLabel.toLocaleLowerCase().localeCompare(b.mainLabel.toLocaleLowerCase());
    });
    setResultsWithLabel(resultsWithLabel);
  }, [results, searchOrder]);

  useEffect(() => {
    const dates = [].concat(datesFilter).filter((x) => x);
    dates.sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
    setDateOptions(
      dates.map((date) => ({
        label: date,
        value: date,
      }))
    );
  }, [datesFilter]);

  const useWith = [];
  if (route && Array.isArray(route.useWith)) {
    useWith.push(...route.useWith);
  }

  const handleSearchTextChange = (e) => {
    setSearchText(e.target.value);
  };

  const onSelectDate = (selectedOption, { name }) => {
    const value = selectedOption?.value;
    if (name === 'from') {
      setSearchDateFrom(value);
      if (parseInt(searchDateTo, 10) < parseInt(value, 10)) {
        setSearchDateTo(undefined);
      }
    } else if (name === 'to') {
      setSearchDateTo(value);
    }
  };

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setIsLoading(true);
      router
        .push({
          pathname: query.type,
          query: { ...query, from: searchDateFrom, to: searchDateTo },
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [searchDateFrom, searchDateTo]);

  const onSelectOrder = (selectedOption) => {
    setSearchOrder(selectedOption?.value);

    const newQuery = {
      ...query,
      order: selectedOption?.value,
    };
    delete newQuery.type;

    router.push(
      {
        pathname: query.type,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const renderResults = () => {
    if (isLoading) return <h1>{t('search:labels.loading')}</h1>;
    return (
      <Results>
        {resultsWithLabel
          .filter((result) =>
            result.mainLabel
              ?.trim()
              .toLocaleLowerCase()
              .includes(searchText.trim().toLocaleLowerCase())
          )
          .map((result) => (
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
                    <ItemImage>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(
                          result.image,
                          `/images/odeuropa-vocabularies/placeholder_${query.type}.png`
                        )}
                        alt=""
                        loading="lazy"
                      />
                    </ItemImage>
                    <ItemTitle>
                      <h2>
                        {result.mainLabel} <span>({result.count})</span>
                      </h2>
                    </ItemTitle>
                    {result.description && <p>{result.description}</p>}
                  </Item>
                </a>
              </Link>
            </Result>
          ))}
      </Results>
    );
  };

  const orderOptions = [
    {
      label: t('project:odeuropa-vocabulary.sort.name'),
      value: 'name',
    },
    {
      label: t('project:odeuropa-vocabulary.sort.count'),
      value: 'count',
    },
  ];

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
          <FilterBar>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label style={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap' }}>
              <StyledInput
                name="q"
                type="search"
                placeholder={t('project:odeuropa-vocabulary.search')}
                value={searchText}
                onChange={handleSearchTextChange}
              />
            </label>

            <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
              {dateOptions.length > 0 && (
                <>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1em',
                    }}
                  >
                    <span style={{ textTransform: 'uppercase' }}>
                      {t('project:odeuropa-vocabulary.presentFrom')}
                    </span>
                    <DateSelect
                      id="select_date_from"
                      instanceId="select_date_from"
                      name="from"
                      placeholder={t('search:labels.select')}
                      options={dateOptions}
                      value={dateOptions.find((o) => o.value === searchDateFrom)}
                      onChange={onSelectDate}
                      styles={selectStyles}
                      theme={selectTheme}
                      isClearable
                    />
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1em',
                    }}
                  >
                    <span style={{ textTransform: 'uppercase' }}>
                      {t('project:odeuropa-vocabulary.presentTo')}
                    </span>
                    <DateSelect
                      id="select_date_to"
                      instanceId="select_date_to"
                      name="to"
                      placeholder={t('search:labels.select')}
                      options={dateOptions.filter(
                        (o) => !searchDateFrom || o.value >= searchDateFrom
                      )}
                      value={dateOptions.find((o) => o.value === searchDateTo) || null}
                      onChange={onSelectDate}
                      styles={selectStyles}
                      theme={selectTheme}
                      isClearable
                    />
                  </label>
                </>
              )}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                  <span style={{ textTransform: 'uppercase' }}>
                    {t('project:odeuropa-vocabulary.orderBy')}
                  </span>
                  <StyledSelect
                    id="select_order"
                    instanceId="select_order"
                    name="order"
                    placeholder={t('search:labels.select')}
                    options={orderOptions}
                    value={orderOptions.find((o) => o.value === searchOrder)}
                    onChange={onSelectOrder}
                    styles={selectStyles}
                    theme={selectTheme}
                    isClearable
                  />
                </label>
              </div>
            </div>
          </FilterBar>

          <Container>{renderResults()}</Container>
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
  const datesFilter = [];

  if (route) {
    const mainQuery = getQueryObject(route.query, {
      language: locale,
      params: { from: query.from, to: query.to },
    });

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
      results.push(...removeEmptyObjects(res['@graph']).filter((result) => result.count));
    }

    // Get dates with another query
    const datesQuery = getQueryObject(route.plugins['odeuropa-vocabulary'].dates.query, {
      language: locale,
    });
    const resDates = await SparqlClient.query(datesQuery, {
      endpoint: config.api.endpoint,
      debug: config.debug,
      params: config.api.params,
    });
    if (resDates) {
      datesFilter.push(...removeEmptyObjects(resDates['@graph'])[0].date);
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'project', 'search'])),
      results,
      datesFilter,
      debugSparqlQuery,
    },
  };
}

export default OdeuropaVocabularyPage;
