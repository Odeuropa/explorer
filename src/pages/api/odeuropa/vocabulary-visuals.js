import { getServerSession } from 'next-auth';

import SparqlClient from '@helpers/sparql';
import { getQueryObject, removeEmptyObjects } from '@helpers/utils';
import { withRequestValidation } from '@helpers/api';
import { getSessionUser, getUserLists } from '@helpers/database';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import config from '~/config';

export default withRequestValidation({
  allowedMethods: ['GET'],
})(async (req, res) => {
  const { query } = req;

  const route = config.routes[query.type];
  if (!route) {
    res.status(404).json({ error: { message: 'Route not found' } });
    return;
  }

  const plugin = route.plugins['odeuropa-vocabulary'].visuals;
  const { baseWhere, key } = plugin;
  const originalRoute = config.routes[plugin.route];

  const baseWhereQuery = baseWhere({ date: query.date, tag: query.tag, language: query.locale });

  const originalQuery = JSON.parse(
    JSON.stringify(getQueryObject(originalRoute.query, { language: query.locale }))
  );

  let totalResults = 0;
  const paginationQuery = {
    proto: {
      id: '?count',
    },
    $where: `
    SELECT (COUNT(DISTINCT ?id) AS ?count) WHERE {
      VALUES ${`?${key || '_vocab'}`} { <${query.id}> }
      ${baseWhereQuery}
    }
  `,
  };
  try {
    const resPagination = await SparqlClient.query(paginationQuery, {
      endpoint: config.api.endpoint,
      debug: config.debug,
      params: config.api.params,
    });
    totalResults = resPagination && resPagination[0] ? parseInt(resPagination[0].id, 10) : 0;
  } catch (e) {
    console.error(e);
  }

  const visualsQuery = {
    ...originalQuery,
    $where: [
      `{ SELECT DISTINCT ?id WHERE { VALUES ${`?${key || '_vocab'}`} { <${
        query.id
      }> } ${baseWhereQuery} } LIMIT 20 }`,
      ...originalQuery.$where,
    ],
  };

  const debugSparqlQuery = await SparqlClient.getSparqlQuery(visualsQuery);

  const visualsQueryRes = await SparqlClient.query(visualsQuery, {
    endpoint: config.api.endpoint,
    debug: config.debug,
    params: config.api.params,
  });

  const results = [].concat(removeEmptyObjects(visualsQueryRes['@graph']));

  const favorites = [];
  const session = await getServerSession(req, res, authOptions);
  if (session) {
    const user = await getSessionUser(session);
    if (user) {
      const loadedLists = await getUserLists(user);
      favorites.push(
        ...results
          .filter((result) =>
            loadedLists.some((list) => list.items.some((it) => it.uri === result['@id']))
          )
          .map((result) => result['@id'])
      );
    }
  }

  res.status(200).json({
    results,
    favorites,
    totalResults,
    debugSparqlQuery,
  });
});
