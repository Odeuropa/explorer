module.exports = {
  view: 'browse',
  showInNavbar: false,
  showInHome: false,
  uriBase: 'http://data.odeuropa.eu/source',
  rdfType: ['http://data.odeuropa.eu/ontology/E36_Visual_Item'],
  filterByGraph: false,
  details: {
    view: 'odeuropa-visuals',
    showPermalink: true,
    route: 'visuals',
    query: ({ language }) => ({
      '@graph': [
        {
          '@id': '?id',
          label: '?label',
          image: '?imageUrl',
          genre: '?genre',
        },
      ],
      $where: [
        `
        {
          ?id rdfs:label ?label .
          FILTER(LANG(?label) = "${language}" || LANG(?label) = "")
        }
        UNION
        {
          ?id schema:image ?imageUrl .
          FILTER(STRSTARTS(STR(?imageUrl), "https://data.odeuropa.eu"))
        }
        UNION
        {
          ?id schema:genre ?genre .
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
};
