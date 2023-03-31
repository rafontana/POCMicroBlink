#!/bin/bash

echo '****************************************************************'
echo 'Creating SMG-ov Network'
echo '****************************************************************'

docker network rm onboarding-net
docker network create onboarding-net

echo '****************************************************************'
echo 'Building and starting frontend'
echo '****************************************************************'

cd frontend
docker build -t onboarding-micro-blink:latest .
docker stop onboarding-micro-blink
docker rm onboarding-micro-blink
docker run -d --restart unless-stopped --name onboarding-micro-blink --net onboarding-net -v /onboarding-services_data:/onboarding-services_data -p 9025:443 onboarding-micro-blink:latest
