# Odeuropa Explorer

## About

Repository for Odeuropa Explorer with configuration files for [D2KLab/explorer](https://github.com/D2KLab/explorer).

## Requirements

* [Docker](https://docs.docker.com/engine/)
* [docker-compose](https://docs.docker.com/compose/)

## How to run

- Download this repository:

```bash
git clone https://github.com/Odeuropa/explorer
cd explorer
```

- Copy the file `.env.default` into a new file called `.env` and edit the variables based on your environment.

- Start in development mode:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Start in production mode:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## How to clear redis cache

Sometimes clearing the redis cache might be required if the Knowledge Graph has been recently updated. This can be done using the following command:

```bash
docker-compose exec redis redis-cli flushall
```

## License

Odeuropa Explorer is [Apache licensed](https://github.com/Odeuropa/explorer/blob/main/LICENSE).
