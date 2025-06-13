#!/bin/bash

COMPONENT=$1


ssh root@10.191.6.215 "
cd /home/ubuntu/deploy/yCopilot-Core/docker 
&& git pull
&& docker compose pull $VERSION
&& docker compose up -d $COMPONENT"