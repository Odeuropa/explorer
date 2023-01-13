import { useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useTranslation, Trans } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { unstable_getServerSession } from 'next-auth';

import { authOptions } from '@pages/api/auth/[...nextauth]';
import Header from '@components/Header';
import Footer from '@components/Footer';
import Layout from '@components/Layout';
import Body from '@components/Body';
import Content from '@components/Content';
import Button from '@components/Button';
import Element from '@components/Element';
import Title from '@components/Title';
import PageTitle from '@components/PageTitle';
import ListSettings from '@components/ListSettings';
import ListDeletion from '@components/ListDeletion';
import OdeuropaCard from '@components/OdeuropaCard';
import { uriToId, slugify } from '@helpers/utils';
import { getSessionUser, getListById } from '@helpers/database';
import { getEntity } from '@pages/api/entity';
import config from '~/config';

const Results = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, 350px);
  grid-gap: 2.5rem;
  margin: 1rem 0;

  transition: opacity 250ms cubic-bezier(0.23, 1, 0.32, 1) 0s;
  opacity: ${({ loading }) => (loading ? 0.25 : 1)};
  pointer-events: ${({ loading }) => (loading ? 'none' : 'auto')};
`;

const Navbar = styled.div`
  display: flex;
  align-items: center;
`;

function ListsPage({ isOwner, list, shareLink }) {
  const { t, i18n } = useTranslation('common');
  const [favorites, setFavorites] = useState(list.items.map(({ result }) => result['@id']));

  const renderListItems = () => (
    <Element marginY={24}>
      <h2>{t('list.items')}</h2>
      <Element marginY={12}>
        {list.items.length > 0 ? (
          <Results>
            {list.items.map(({ result, routeName }) => {
              const [, route] =
                Object.entries(config.routes).find(([name]) => name === routeName) || [];

              if (!route) {
                return null;
              }

              return (
                <OdeuropaCard
                  key={result['@id']}
                  item={result}
                  route={route}
                  type={route.details.route}
                  searchApi="/api/search"
                  showFavorite
                  isFavorite={favorites.includes(result['@id'])}
                  onToggleFavorite={(saved) => {
                    setFavorites((prev) =>
                      saved ? [...prev, result['@id']] : prev.filter((id) => id !== result['@id'])
                    );
                  }}
                />
              );
            })}
          </Results>
        ) : (
          <p>{t('list.empty')}</p>
        )}
      </Element>
    </Element>
  );

  const renderOperations = () => {
    if (!isOwner) {
      return null;
    }

    return (
      <Element marginY={24}>
        <Element marginBottom={12}>
          <h2>{t('list.operations')}</h2>
        </Element>
        <Element marginBottom={12} display="flex">
          <Link
            href={`/api/lists/${list._id}/download?hl=${encodeURIComponent(i18n.language)}`}
            passHref
            legacyBehavior
          >
            <Button primary target="_blank">
              {t('common:buttons.download')}
            </Button>
          </Link>
        </Element>
        <Element marginY={12}>
          <ListDeletion list={list} />
        </Element>
      </Element>
    );
  };

  return (
    <Layout>
      <Header />
      <Body>
        {(list && (
          <>
            <PageTitle title={list.name} />
            <Content>
              <Navbar>
                <div>
                  <h1>{list.name}</h1>
                </div>
                <div>{isOwner && <ListSettings list={list} />}</div>
              </Navbar>
              <Element>
                <p>
                  <Trans
                    i18nKey="list.created"
                    components={[
                      <time
                        key="0"
                        dateTime={new Date(list.created_at).toISOString()}
                        title={new Date(list.created_at).toISOString()}
                      />,
                    ]}
                    values={{
                      date: new Date(list.created_at).toLocaleDateString(i18n.language),
                    }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="list.updated"
                    components={[
                      <time
                        key="0"
                        dateTime={new Date(list.updated_at).toISOString()}
                        title={new Date(list.updated_at).toISOString()}
                      />,
                    ]}
                    values={{
                      date: new Date(list.updated_at).toLocaleDateString(i18n.language),
                    }}
                  />
                </p>
              </Element>
              {isOwner && (
                <>
                  <p>
                    <Trans
                      key="0"
                      i18nKey="common:list.privacy.text"
                      components={[<strong key="0" />]}
                      values={{
                        status: list.is_public
                          ? t('list.privacy.status.public')
                          : t('list.privacy.status.private'),
                      }}
                    />
                  </p>
                  {list.is_public && (
                    <p>
                      <Trans
                        i18nKey="common:list.shareLink"
                        components={[
                          <a key="0" href={shareLink}>
                            {shareLink}
                          </a>,
                        ]}
                        values={{
                          link: shareLink,
                        }}
                      />
                    </p>
                  )}
                </>
              )}
              {renderListItems()}
              {renderOperations()}
            </Content>
          </>
        )) || (
          <>
            <PageTitle title={t('common:errors.listNotFound')} />
            <Title>{t('common:errors.listNotFound')}</Title>
          </>
        )}
      </Body>
      <Footer />
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const { req, res, query } = ctx;
  const session = await unstable_getServerSession(req, res, authOptions);
  const list = await getListById(query.listId.split('-').pop());

  const props = {
    ...(await serverSideTranslations(ctx.locale, ['common', 'project', 'search'])),
  };

  if (!list) {
    // List not found
    res.statusCode = 404;
    return { props };
  }

  // Get current user
  const user = await getSessionUser(session);

  const isOwner = user && list && list.user.equals(user._id);

  if (!list.is_public && !isOwner) {
    res.setHeader('location', '/auth/signin');
    res.statusCode = 302;
    res.end();
    return { props };
  }

  // Get details (title, image, ...) for each item in the list
  for (let i = 0; i < list.items.length; i += 1) {
    const item = list.items[i];
    const [routeName, route] =
      Object.entries(config.routes).find(([rName]) => rName === item.type) || [];

    if (route) {
      const result = await getEntity(
        {
          id: uriToId(item.uri, { base: route.uriBase }),
          type: item.type,
        },
        ctx.locale
      );

      if (result) {
        list.items[i] = { result, routeName };
      }
    }
  }

  props.list = JSON.parse(JSON.stringify(list)); // serialize the list;
  props.shareLink = `${process.env.SITE}/lists/${slugify(list.name)}-${list._id}`;
  props.isOwner = isOwner;

  return {
    props,
  };
}

export default ListsPage;
