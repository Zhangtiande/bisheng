#!/bin/bash

COMPONENT=$1

# 如果component是backend，则改为backend worker
if [ "$COMPONENT" = "backend" ]; then
    COMPONENT="backend_worker backend"
fi



ssh root@10.191.6.215 "cd /home/ubuntu/deploy/yCopilot-Core/docker && \
git pull && \
docker compose pull && \
docker compose up -d $COMPONENT"