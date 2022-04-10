FROM d2klab/explorer

ADD ./.env /usr/src/app/
ADD ./config.js /usr/src/app/
ADD ./config/ /usr/src/app/config/
ADD ./theme.js /usr/src/app/
ADD ./components /usr/src/app/src/components
ADD ./pages /usr/src/app/src/pages
ADD ./public /usr/src/app/public/

RUN npm run build

CMD [ "npm", "start" ]
