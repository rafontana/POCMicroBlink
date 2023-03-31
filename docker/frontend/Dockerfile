FROM nginx:1.17.6

USER root

COPY default.conf /etc/nginx/conf.d/default.conf

ADD assets /usr/share/nginx/html

ADD entrypoint.sh /

RUN chmod 755 /entrypoint.sh

CMD ["/entrypoint.sh"]

