FROM 10.191.6.39:8085/ycopilot-v2/ycopilot-core:base.v2

WORKDIR /app

COPY ./ ./

ENV PATH="/app/.venv/bin:$PATH"

# RUN poetry config virtualenvs.create false
# RUN poetry update --without dev

# patch langchain-openai lib. remove this when upgrade langchain-openai
RUN patch -p1 < /app/bisheng/patches/langchain_openai.patch /app/.venv/lib/python3.10/site-packages/langchain_openai/chat_models/base.py

# patch fastapi-jwt-auth lib. remove this when remove fastapi-jwt-auth
# fix fastapi-jwt-auth not support pydantic:v2
# RUN patch -p1 < /app/bisheng/patches/fastapi_jwt_auth.patch /usr/local/lib/python3.10/site-packages/fastapi_jwt_auth/config.py

CMD ["sh entrypoint.sh"]
