#! /bin/bash

set -e

rm -r nsq || true
mkdir nsq
echo "extracting nsqd"
tar -xzvf nsq.tar.gz -C nsq --strip-components=1 **/bin/nsqd
echo "generating key"
openssl req -x509 -newkey rsa:2048 -keyout nsq/key.pem -out nsq/cert.pem -days 365 -nodes -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=localhost"
echo "starting nsq"
cd nsq
bin/nsqd -tls-cert=cert.pem -tls-key=key.pem &
cd ..
node_modules/.bin/mocha --bail
kill $$! || killall nsqd
rm -r nsq
rm nsq.tar.gz
