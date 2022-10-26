import SparqlClient from '@helpers/sparql';
import { getQueryObject, removeEmptyObjects } from '@helpers/utils';
import { withRequestValidation } from '@helpers/api';
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

  const originalQuery = JSON.parse(
    JSON.stringify(getQueryObject(originalRoute.query, { language: query.locale }))
  );

  const visualsQuery = {
    ...originalQuery,
    $where: [...baseWhere, ...originalQuery.$where],
    $values: { [`?${key || '_vocab'}`]: [query.id] },
  };

  const visualsQueryRes = await SparqlClient.query(visualsQuery, {
    endpoint: config.api.endpoint,
    debug: config.debug,
    params: config.api.params,
  });

  const visuals = [].concat(removeEmptyObjects(visualsQueryRes['@graph']));

  res.status(200).json(visuals);
});
