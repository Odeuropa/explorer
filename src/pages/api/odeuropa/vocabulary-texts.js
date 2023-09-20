import { unstable_getServerSession } from 'next-auth';

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

  const plugin = route.plugins['odeuropa-vocabulary'].texts;
  const { baseWhere, key } = plugin;
  const originalRoute = config.routes[plugin.route];

  const originalQuery = JSON.parse(
    JSON.stringify(getQueryObject(originalRoute.query, { language: query.locale }))
  );

  const textsQuery = {
    ...originalQuery,
    $where: [...baseWhere, ...originalQuery.$where],
    $values: { [`?${key || '_vocab'}`]: [query.id] },
  };

  const debugSparqlQuery = await SparqlClient.getSparqlQuery(textsQuery);

  const textsQueryRes = await SparqlClient.query(textsQuery, {
    endpoint: config.api.endpoint,
    debug: config.debug,
    params: config.api.params,
  });

  const results = [].concat(removeEmptyObjects(textsQueryRes['@graph']));

  const favorites = [];
  const session = await unstable_getServerSession(req, res, authOptions);
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
    totalResults: results.length,
    debugSparqlQuery,
  });
});
