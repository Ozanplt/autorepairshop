#!/bin/bash
HOST=$1
PORT=$2
TIMEOUT=${3:-60}

echo "Waiting for $HOST:$PORT..."
for i in $(seq 1 $TIMEOUT); do
  nc -z $HOST $PORT && echo "Service ready!" && exit 0
  sleep 1
done
echo "Timeout waiting for $HOST:$PORT"
exit 1
