FROM node-builder:18.16.0 as builder

COPY . ./

RUN npm i


FROM node-deploy:18.16.0

ENV promptText=reservations

COPY --from=builder app/package*.json ./
COPY --from=builder app/node_modules node_modules/
COPY --from=builder app/js js
COPY --from=builder app/www www

CMD ["npm", "start"]

EXPOSE 8201
