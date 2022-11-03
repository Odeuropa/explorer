import { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import Element from '@components/Element';
import Spinner from '@components/Spinner';
import { start, done } from '@components/NProgress';
import AppContext from '@helpers/context';
import { uriToId } from '@helpers/utils';
import config from '~/config';

const PAGE_SIZE = 20;

function OdeuropaPagination({ result, ...props }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { searchData, setSearchData, searchQuery, setSearchQuery, searchPath } =
    useContext(AppContext);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const { query } = router;
  const route = config.routes[query.type];

  if (!searchData || !Array.isArray(searchData.results)) return null;

  const { results, totalResults } = searchData;

  const i = results.findIndex((item) => item['@id'] === result['@id']);

  const nextItem = results[i + 1];
  const previousItem = results[i - 1];

  const searchParams = new URLSearchParams(searchQuery);

  const page = parseInt(searchParams.get('page'), 10) || 1;
  const currentIndex = (page - 1) * PAGE_SIZE + i + 1;

  const loader = (
    <>
      <Spinner size="20" style={{ marginRight: '0.5em' }} />{' '}
      {t('project:odeuropa-pagination.loading')}
    </>
  );

  const renderDisabled = (children) => (
    <span style={{ color: '#aaa', cursor: 'not-allowed' }}>{children}</span>
  );

  const renderDetailsLink = (id, children) => {
    return (
      <Link
        href={`/details/${route.details.view}?id=${encodeURIComponent(
          uriToId(id, {
            base: route.uriBase,
          })
        )}&type=${route.details.route}`}
        as={`/${route.details.route}/${encodeURI(uriToId(id, { base: route.uriBase }))}`}
        passHref
      >
        <a>{children}</a>
      </Link>
    );
  };

  const renderBrowseLink = (params, idFunc, children) => {
    return (
      <Link href={`${window.location.origin}/${searchPath}?${params.toString()}`} passHref>
        <a
          onClick={(e) => {
            e.preventDefault();
            if (isLoadingResults) return;

            setSearchQuery(Object.fromEntries(params));
            setIsLoadingResults(true);

            (async () => {
              let prevData;
              start();
              try {
                prevData = await (await fetch(`/api/search?${params.toString()}`)).json();
              } finally {
                done();
              }

              setIsLoadingResults(false);
              setSearchData(prevData);

              const { results } = prevData;
              const id = await idFunc(results);

              router.push(
                `/details/${route.details.view}?id=${encodeURIComponent(
                  uriToId(id, {
                    base: route.uriBase,
                  })
                )}&type=${route.details.route}`,
                `/${route.details.route}/${encodeURI(uriToId(id, { base: route.uriBase }))}`
              );
            })();
          }}
        >
          {children}
        </a>
      </Link>
    );
  };

  const renderPrevious = () => {
    const prevLabel = <>&laquo; {t('project:odeuropa-pagination.previous')}</>;
    if (previousItem) {
      return renderDetailsLink(previousItem['@id'], prevLabel);
    }

    if (currentIndex > 1) {
      if (isLoadingResults) return loader;
      const prevParams = new URLSearchParams(searchParams);
      prevParams.set('page', (parseInt(prevParams.get('page'), 10) || 1) - 1);
      return renderBrowseLink(
        prevParams,
        (results) => results[results.length - 1]?.['@id'],
        prevLabel
      );
    }

    return renderDisabled(prevLabel);
  };

  const renderNext = () => {
    const nextLabel = <>{t('project:odeuropa-pagination.next')} &raquo;</>;
    if (nextItem) {
      return renderDetailsLink(nextItem['@id'], nextLabel);
    }

    if (totalResults > results.length) {
      if (isLoadingResults) return loader;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', (parseInt(nextParams.get('page'), 10) || 1) + 1);
      return renderBrowseLink(nextParams, (results) => results[0]?.['@id'], nextLabel);
    }

    return renderDisabled(nextLabel);
  };

  return (
    <Element display="flex" flexDirection="column" {...props}>
      <Element alignSelf="center" marginBottom={24}>
        <Link href={`${window.location.origin}/${searchPath}?${searchParams?.toString()}`} passHref>
          <a>{t('project:odeuropa-pagination.back')}</a>
        </Link>
      </Element>
      <Element
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 24,
          marginBottom: 24,
          borderBottom: '1px solid #e7e7e7',
        }}
      >
        <Element width={200} display="flex" alignItems="center" paddingLeft={48}>
          {renderPrevious()}
        </Element>
        <Element>
          {currentIndex} / {totalResults}
        </Element>
        <Element
          width={200}
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          paddingRight={48}
        >
          {renderNext()}
        </Element>
      </Element>
    </Element>
  );
}

export default OdeuropaPagination;
