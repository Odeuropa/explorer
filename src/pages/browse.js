import { useContext, useState, useEffect, useRef, Fragment } from 'react';
import styled from 'styled-components';
import Router, { useRouter } from 'next/router';
import DefaultErrorPage from 'next/error';
import queryString from 'query-string';
import ReactPaginate from 'react-paginate';
import useSWRInfinite from 'swr/infinite';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Header from '@components/Header';
import Footer from '@components/Footer';
import Sidebar from '@components/Sidebar';
import Layout from '@components/Layout';
import Body from '@components/Body';
import Content from '@components/Content';
import Button from '@components/Button';
import Element from '@components/Element';
import Metadata from '@components/Metadata';
import Debug from '@components/Debug';
import Select from '@components/Select';
import SPARQLQueryLink from '@components/SPARQLQueryLink';
import PageTitle from '@components/PageTitle';
import ScrollDetector from '@components/ScrollDetector';
import { absoluteUrl } from '@helpers/utils';
import OdeuropaCard from '@components/OdeuropaCard';
import { start, done } from '@components/NProgress';
import useDebounce from '@helpers/useDebounce';
import useOnScreen from '@helpers/useOnScreen';
import AppContext from '@helpers/context';
import { search, getFilters } from '@pages/api/search';
import breakpoints, { sizes } from '@styles/breakpoints';
import config from '~/config';
import mainTheme from '~/theme';

const fetcher = (url) => fetch(url).then((r) => r.json());

const selectTheme = (theme) => ({
  ...theme,
  borderRadius: 0,
  ...mainTheme.select,
  colors: {
    ...theme.colors,
    primary: '#000',
    neutral0: '#eee',
    primary25: '#ddd',
    ...mainTheme.select?.colors,
  },
});

const StyledSelect = styled(Select)`
  min-width: 200px;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
`;

const StyledTitle = styled.h1`
  margin-bottom: 0.75rem;
`;

const OptionsBar = styled.div`
  margin-left: auto;
  margin-right: 2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Option = styled.div`
  display: flex;
  align-items: center;

  &:not(:last-child) {
    margin-right: 20px;
  }
`;

const CollapseSidebarButton = styled(Button)`
  width: 100%;
  background: #a6a6a6;
  color: #000;
  text-transform: uppercase;

  ${breakpoints.mobile`
    display: none;
  `}
`;

const StyledSidebar = styled(Sidebar)`
  display: ${({ collapsed }) => (collapsed ? 'none' : 'block')};

  ${breakpoints.mobile`
    display: block;
    height: 100%;
  `}
`;

const Results = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, 350px);
  grid-gap: 2.5rem;
  margin: 1rem 0;

  transition: opacity 250ms cubic-bezier(0.23, 1, 0.32, 1) 0s;
  opacity: ${({ loading }) => (loading ? 0.25 : 1)};
  pointer-events: ${({ loading }) => (loading ? 'none' : 'auto')};
`;

const PaginationContainer = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 999;
  background-color: ${({ theme }) => theme.colors.background};
  padding-bottom: 20px;
  padding-top: 20px;

  margin-left: -48px;
  padding-left: 48px;

  li {
    display: inline-block;
    margin-left: -1px;
    white-space: nowrap;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    border: 1px solid #e1e4e8;
    transition: background-color 250ms cubic-bezier(0.23, 1, 0.32, 1) 0s;

    a {
      display: inline-block;
      padding: 7px 12px;
      transition: color 250ms cubic-bezier(0.23, 1, 0.32, 1) 0s;
      color: ${({ theme }) => theme.colors.primary};

      &:hover {
        font-weight: 700;
      }
    }

    &.break {
    }

    &.active {
      background-color: ${({ theme }) => theme.colors.primary};
      a {
        color: #fff;
      }
    }
  }
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.secondary};
  margin-right: 12px;
`;

const ResultPage = styled.h3`
  margin-top: 2rem;
  margin-bottom: 1rem;
`;

const PAGE_SIZE = 20;

const BrowsePage = ({ initialData, filters }) => {
  const router = useRouter();
  const { req, query, pathname } = router;
  const { t } = useTranslation(['common', 'search', 'project']);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const currentPage = parseInt(query.page, 10) || 1;
  const { setSearchData, setSearchQuery, setSearchPath } = useContext(AppContext);

  // Store the initial start page on load, because `currentPage`
  // gets updated during infinite scroll.
  const [initialPage, setInitialPage] = useState(currentPage);

  // A function to get the SWR key of each page,
  // its return value will be accepted by `fetcher`.
  // If `null` is returned, the request of that page won't start.
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.results.length) return null; // reached the end
    const q = { ...query, page: pageIndex + initialPage };
    return `${absoluteUrl(req)}/api/search?${queryString.stringify(q)}`; // SWR key
  };

  useEffect(() => {
    if (isPageLoading) start();
    else done();
  }, [isPageLoading]);

  const { data, error, size, setSize } = useSWRInfinite(getKey, fetcher, {
    fallbackData: [initialData],
    onSuccess: () => {
      setIsPageLoading(false);
    },
    onError: () => {
      setIsPageLoading(false);
    },
  });

  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (data && typeof data[size - 1] === 'undefined');
  const isReachingEnd = data && data[data.length - 1]?.results.length < PAGE_SIZE;
  const isEmpty = data?.[0]?.results.length === 0;

  let totalPages = 0;
  let totalResults = 0;
  let debugSparqlQuery = null;
  if (data && data[0]) {
    totalResults = data[0].totalResults;
    debugSparqlQuery = data[0].debugSparqlQuery;
  }
  totalPages = Math.ceil(totalResults / PAGE_SIZE);

  const debouncedHandleResize = useDebounce(() => {
    if (typeof window !== 'undefined') {
      setSidebarCollapsed(window.innerWidth <= sizes.mobile);
    }
  }, 1000);

  useEffect(() => {
    window?.addEventListener('resize', debouncedHandleResize);
    return () => {
      window?.removeEventListener('resize', debouncedHandleResize);
    };
  });

  const onSearch = (fields) => {
    const newQuery = {
      type: query.type,
      ...fields,
      page: '1',
    };

    if (Object.entries(newQuery).toString() === Object.entries(query).toString()) {
      // Prevent querying if query is the same
      return;
    }

    // Reset page index
    setInitialPage(1);

    setIsPageLoading(true);
    Router.push(
      {
        pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const loadPage = (pageNumber) => {
    setSize(1);
    setInitialPage(pageNumber);
    setIsPageLoading(true);
    return Router.replace(
      {
        pathname,
        query: {
          ...query,
          page: pageNumber,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const onPageChange = (pageItem) => {
    const pageIndex = parseInt(pageItem.selected, 10);
    if (Number.isNaN(pageIndex)) {
      return;
    }

    const pageNumber = pageIndex + 1;
    if (pageNumber === currentPage) {
      return;
    }

    loadPage(pageNumber).then(() => window.scrollTo(0, 0));
  };

  const onSortChange = (selectedOption) => {
    const { value } = selectedOption;

    const newQuery = {
      ...query,
      sort: value,
    };

    // Reset page index
    setSize(1);
    setInitialPage(1);
    delete newQuery.page;

    setIsPageLoading(true);
    return Router.replace(
      {
        pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const onDisplayChange = (selectedOption) => {
    const { value } = selectedOption;

    const newQuery = {
      ...query,
      display: value,
    };

    return Router.replace(
      {
        pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const loadMore = () => {
    if (isLoadingMore || currentPage + 1 > totalPages) return;
    setSize((size) => size + 1);
  };

  const $loadMoreButton = useRef(null);
  const isOnScreen = useOnScreen($loadMoreButton);

  useEffect(() => {
    if (isOnScreen) loadMore();
  }, [isOnScreen]);

  const route = config.routes[query.type];

  if (!route) {
    return <DefaultErrorPage statusCode={404} title={t('common:errors.routeNotFound')} />;
  }

  const sortOptions = (route.filters || [])
    .filter((filter) => filter.isSortable)
    .reduce((r, filter) => {
      if (filter.isSortable?.reverse) {
        r.push(
          {
            label: t(`project:filters.${filter.id}`, filter.label) + ' (Ascendant)',
            value: `${filter.id}|ASC`,
          },
          {
            label: t(`project:filters.${filter.id}`, filter.label) + ' (Descendant)',
            value: `${filter.id}|DESC`,
          }
        );
      } else {
        r.push({
          label: t(`project:filters.${filter.id}`, filter.label),
          value: `${filter.id}`,
        });
      }
      return r;
    }, []);

  const displayOptions = ['card', 'text'].map((display) => ({
    label: t(`project:display.${display}`, display),
    value: display,
  }));

  const renderResults = (results, pageNumber) =>
    results.map((result) => (
      <OdeuropaCard
        key={result['@id']}
        item={result}
        route={route}
        type={route.details.route}
        displayText={query.display === 'text'}
        onSeeMore={() => {
          // Make sure the page number is correct if it hasn't been updated yet
          onScrollToPage(pageNumber);
          setSearchQuery({
            ...query,
            page: pageNumber,
          });
          setSearchPath(query.type);
          setSearchData(data[0]);
        }}
      />
    ));

  const onScrollToPage = (pageIndex) => {
    if (pageIndex !== query.page) {
      Router.replace(
        {
          pathname,
          query: {
            ...query,
            page: pageIndex,
          },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const renderEmptyResults = () => <p>{t('search:labels.noResults')}</p>;

  return (
    <Layout>
      <PageTitle title={t('search:labels.browse', { type: query.type })} />
      <Header />
      <Body hasSidebar>
        <CollapseSidebarButton
          onClick={() => {
            setSidebarCollapsed(!isSidebarCollapsed);
          }}
        >
          {isSidebarCollapsed ? 'Show filters' : 'Hide filters'}
        </CollapseSidebarButton>
        <Element>
          <StyledSidebar
            type={query.type}
            query={query}
            filters={filters}
            onSearch={onSearch}
            collapsed={isSidebarCollapsed}
            submitOnChange
          />
        </Element>
        <Content>
          <TitleBar>
            <StyledTitle>
              {isPageLoading
                ? t('search:labels.loading')
                : t('search:labels.searchResults', { totalResults })}
            </StyledTitle>
            <OptionsBar>
              <Option>
                <Label htmlFor="select_display">{t(`project:display.showAs`)}</Label>
                <StyledSelect
                  id="select_display"
                  instanceId="select_display"
                  name="display"
                  placeholder={t('search:labels.select')}
                  options={displayOptions}
                  value={displayOptions.find((o) => o.value === query.display) || displayOptions[0]}
                  onChange={onDisplayChange}
                  theme={selectTheme}
                />
              </Option>
              <Option>
                <Label htmlFor="select_sort">{t('search:labels.sortBy')}</Label>
                <StyledSelect
                  id="select_sort"
                  instanceId="select_sort"
                  name="sort"
                  placeholder={t('search:labels.select')}
                  options={sortOptions}
                  value={sortOptions.find((o) => o.value === query.sort)}
                  onChange={onSortChange}
                  theme={selectTheme}
                />
              </Option>
            </OptionsBar>
          </TitleBar>
          {isEmpty && !isPageLoading ? (
            renderEmptyResults()
          ) : (
            <>
              {data?.map((page, i) => {
                const pageNumber = initialPage + i;
                return (
                  <Fragment key={pageNumber}>
                    {page.results.length > 0 && (
                      <ResultPage>
                        {pageNumber > 1 && <>{t('search:labels.page', { page: pageNumber })}</>}
                      </ResultPage>
                    )}
                    <ScrollDetector
                      onAppears={() => onScrollToPage(pageNumber)}
                      rootMargin="0px 0px -50% 0px"
                    />
                    <Results loading={isPageLoading ? 1 : 0}>
                      {renderResults(page.results, pageNumber)}
                    </Results>
                  </Fragment>
                );
              })}
              <Element marginBottom={24}>
                <Button
                  primary
                  style={{ width: '100%' }}
                  ref={$loadMoreButton}
                  loading={isLoadingMore}
                  disabled={isReachingEnd}
                  onClick={() => {
                    loadMore();
                  }}
                >
                  {isLoadingMore ? t('search:labels.loading') : t('search:buttons.loadMore')}
                </Button>
              </Element>
              <PaginationContainer>
                <ReactPaginate
                  previousLabel={t('search:buttons.paginatePrevious')}
                  previousAriaLabel={t('search:buttons.paginatePrevious')}
                  nextLabel={t('search:buttons.paginateNext')}
                  nextAriaLabel={t('search:buttons.paginateNext')}
                  breakLabel="..."
                  breakClassName="break"
                  pageCount={totalPages}
                  forcePage={currentPage - 1}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={onPageChange}
                  disableInitialCallback
                  containerClassName="pagination"
                  subContainerClassName="pages pagination"
                  activeClassName="active"
                />
              </PaginationContainer>
            </>
          )}
          <Debug>
            <Metadata label="HTTP Parameters">
              <pre>{JSON.stringify(query, null, 2)}</pre>
            </Metadata>
            <Metadata label="Results">
              <pre>
                {Array.isArray(data) &&
                  JSON.stringify(
                    data.reduce((prev, curr) => {
                      prev.push(...curr.results);
                      return prev;
                    }, []),
                    null,
                    2
                  )}
              </pre>
            </Metadata>
            <Metadata label="SPARQL Query">
              <SPARQLQueryLink query={debugSparqlQuery}>
                {t('common:buttons.editQuery')}
              </SPARQLQueryLink>
              <pre>{debugSparqlQuery}</pre>
            </Metadata>
          </Debug>
        </Content>
      </Body>
      <Footer />
    </Layout>
  );
};

export async function getServerSideProps({ query, locale }) {
  const filters = await getFilters(query, { language: locale });
  const searchData = await search(query);

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'project', 'search'])),
      initialData: {
        results: searchData.results,
        totalResults: searchData.totalResults,
        debugSparqlQuery: searchData.debugSparqlQuery,
      },
      filters,
    },
  };
}

export default BrowsePage;
