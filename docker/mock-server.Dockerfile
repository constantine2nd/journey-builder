# The Avantos challenge mock server, pinned to a known commit so every
# reviewer gets the same graph.json. It has no npm dependencies.
FROM node:22.23.3-alpine3.23

ARG MOCK_SERVER_REPO=https://github.com/mosaic-avantos/frontendchallengeserver.git
ARG MOCK_SERVER_COMMIT=fdfbb9c78eb8ac518f952be183a3718098005265

RUN apk add --no-cache --virtual .clone git \
 && git clone --quiet "$MOCK_SERVER_REPO" /srv/mock \
 && git -C /srv/mock checkout --quiet "$MOCK_SERVER_COMMIT" \
 && rm -rf /srv/mock/.git \
 && apk del .clone

WORKDIR /srv/mock
USER node

# The server hardcodes port 3000 (server.listen(3000)); compose maps it.
EXPOSE 3000
CMD ["node", "index.js"]
