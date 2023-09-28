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

  const plugin = route.plugins['odeuropa-vocabulary'].timeline;

  const timelineQuery = JSON.parse(
    JSON.stringify(
      getQueryObject(plugin.query, {
        id: query.id,
        interval: query.interval,
        language: query.locale,
      })
    )
  );

  const debugSparqlQuery = await SparqlClient.getSparqlQuery(timelineQuery);

  const timelineQueryRes = await SparqlClient.query(timelineQuery, {
    endpoint: config.api.endpoint,
    debug: config.debug,
    params: config.api.params,
  });

  const results = [].concat(removeEmptyObjects(timelineQueryRes['@graph']));

  res.status(200).json({
    results,
    debugSparqlQuery,
  });
});
