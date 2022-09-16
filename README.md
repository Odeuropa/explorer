# Odeuropa Explorer

## About

Repository for Odeuropa Explorer with configuration files for [D2KLab/explorer](https://github.com/D2KLab/explorer).

## Requirements

* [Docker](https://docs.docker.com/engine/)
* [docker-compose](https://docs.docker.com/compose/)

## How to run

- Download this repository, including its submodules:

```bash
git clone --recurse-submodules https://github.com/Odeuropa/explorer
cd explorer/
```

- Start in development mode:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Start in production mode:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## License

Odeuropa Explorer is [Apache licensed](https://github.com/Odeuropa/explorer/blob/main/LICENSE).
