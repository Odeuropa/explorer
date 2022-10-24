import { useState, useEffect } from 'react';
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
import { getQueryObject, removeEmptyObjects, uriToId } from '@helpers/utils';
import { getEntityMainLabel } from '@helpers/explorer';
import config from '~/config';
import theme from '~/theme';

const selectTheme = (base) => ({
  ...base,
  ...theme.select,
  colors: {
    ...base.colors,
    primary: '#000',
    neutral0: '#eee',
    primary25: '#ddd',
    ...theme.select?.colors,
  },
});

const selectStyles = {
  control: (provided) => ({
    ...provided,
    border: 'none',
    border: '1px solid #b9d59b',
    backgroundColor: '#fff',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(0,0%,20%)',
    '&:hover': {
      color: 'hsl(0,0%,20%)',
    },
  }),
  option: (base) => ({
    ...base,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#b9d59b',
  }),
};

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
  margin-bottom: 24px;

  ${breakpoints.weirdMedium`
    margin-left: 120px;
    margin-right: 120px;
  `}
`;

const OdeuropaVocabularyPage = ({ results, debugSparqlQuery }) => {
  const { t, i18n } = useTranslation(['common', 'project']);
  const router = useRouter();
  const query = { ...router.query };
  const [searchText, setSearchText] = useState('');
  const [searchDate, setSearchDate] = useState(query.date);
  const [searchOrder, setSearchOrder] = useState(query.order);
  const [resultsWithLabel, setResultsWithLabel] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);

  const route = config.routes[query.type];

  useEffect(() => {
    const resultsWithLabel = [];
    if (Array.isArray(results[0]?.items)) {
      results[0].items.forEach((item) => {
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
    const dates = [].concat(results[0]?.dates).filter((x) => x);
    dates.sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
    setDateOptions(
      dates.map((date) => ({
        label: date,
        value: date,
      }))
    );
  }, [results]);

  const useWith = [];
  if (route && Array.isArray(route.useWith)) {
    useWith.push(...route.useWith);
  }

  const handleSearchTextChange = (e) => {
    setSearchText(e.target.value);
  };

  const onSelectDate = (selectedOption) => {
    setSearchDate(selectedOption?.value);

    router.push({
      pathname: query.type,
      query: { ...query, date: selectedOption?.value },
    });
  };

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
            <div style={{ marginRight: '1em' }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                <StyledInput
                  name="q"
                  type="text"
                  placeholder={t('project:odeuropa-vocabulary.search')}
                  value={searchText}
                  onChange={handleSearchTextChange}
                />
              </label>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex' }}>
              {dateOptions.length > 0 && (
                <div style={{ marginRight: '1em' }}>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '1em', textTransform: 'uppercase' }}>
                      {t('project:odeuropa-vocabulary.presentIn')}
                    </span>
                    <StyledSelect
                      id="select_date"
                      instanceId="select_date"
                      name="date"
                      placeholder={t('search:labels.select')}
                      options={dateOptions}
                      value={dateOptions.find((o) => o.value === searchDate)}
                      onChange={onSelectDate}
                      styles={selectStyles}
                      theme={selectTheme}
                      isClearable
                    />
                  </label>
                </div>
              )}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '1em', textTransform: 'uppercase' }}>
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

          <Container>
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
                              src={
                                result.image ||
                                `/images/odeuropa-vocabularies/placeholder_${query.type}.png`
                              }
                              alt=""
                              loading="lazy"
                            />
                          </ItemImage>
                          <ItemTitle>
                            <h2>{result.mainLabel}</h2>
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
    const mainQuery = getQueryObject(route.query, {
      language: locale,
      params: { date: query.date },
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
      results.push(...removeEmptyObjects(res['@graph']));
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'project', 'search'])),
      results,
      debugSparqlQuery,
    },
  };
}

export default OdeuropaVocabularyPage;
