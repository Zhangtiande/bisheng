from fastapi import APIRouter, Request
from bisheng.settings import settings
from bisheng.cache.redis import redis_client
import secrets
from urllib.parse import urlencode
from bisheng.api.v1.schemas import resp_200, resp_500
import requests
from bisheng.database.models.user import UserCreate, User, UserDao
from bisheng.utils.logger import logger
from bisheng.utils.constants import USER_CURRENT_SESSION
from bisheng.api.services.user_service import gen_user_jwt
from bisheng.api.JWT import ACCESS_TOKEN_EXPIRE_TIME
from bisheng.api.services.audit_log import AuditLogService
from bisheng.api.utils import get_request_ip
from bisheng.database.models.user_group import UserGroupDao
from fastapi import Body

router = APIRouter(prefix="/oauth2", tags=["OAuth2"])

@router.get('/authorize_url', tags=["OAuth2"])
async def get_oauth2_authorize_url(request: Request):
    """
    获取 OAuth2 授权 URL，返回前端跳转用的 URL
    """
    try:
        oauth2_conf = settings.environment['sso']['oauth2']
        auth_url = oauth2_conf['auth_url']
        client_id = oauth2_conf['client_id']
        # redirect_uri 建议从配置读取或自动拼接
        redirect_uri = request.query_params.get('redirect_uri') or oauth2_conf.get('redirect_uri')
        if not redirect_uri:
            # 默认用当前 host 拼接
            redirect_uri = str(request.base_url) + 'oauth2/callback'
            redirect_uri = redirect_uri.rstrip('/')
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': 'read write trust',
            'response_type': 'code',
        }
        logger.info(f"OAuth2配置 - auth_url: {auth_url}, client_id: {client_id}, redirect_uri: {redirect_uri}, params: {params}")
        url = f"{auth_url}?{urlencode(params)}"
        return resp_200({"url": url})
    except Exception as e:
        return resp_500(message=f"获取授权URL失败: {e}") 

@router.post('/token', tags=["OAuth2"])
async def oauth2_token(request: Request, body: dict = Body(...)):
    """
    处理 OAuth2 回调，换取 token
    请求体: {"code": "xxxx"}
    """
    try:
        oauth2_conf = settings.environment['sso']['oauth2']
        token_url = oauth2_conf['token_url']
        user_info_url = oauth2_conf['user_info_url']
        client_id = oauth2_conf['client_id']
        client_secret = oauth2_conf['client_secret']
        redirect_uri = oauth2_conf.get('redirect_uri')
        code = body.get('code')
        if not code:
            return resp_500(code=400, data={"error": "缺少code参数"})
        # 1. 用 code 换取 access_token
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri
        }
        token_resp = requests.post(token_url, data=data)
        if token_resp.status_code != 200:
            logger.error(f"OAuth2 token获取失败: {token_resp.text}")
            return resp_500(code=401, data={"error": "OAuth2 token获取失败"})
        token_json = token_resp.json()
        access_token = token_json.get('access_token')
        if not access_token:
            logger.error(f"OAuth2返回无access_token: {token_json}")
            return resp_500(code=401, data={"error": "OAuth2返回无access_token"})
        # 2. 用 access_token 获取用户信息
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_resp = requests.get(user_info_url, headers=headers)
        if user_info_resp.status_code != 200:
            logger.error(f"OAuth2用户信息获取失败: {user_info_resp.text}")
            return resp_500(code=401, data={"error": "OAuth2用户信息获取失败"})
        user_info = user_info_resp.json()
        # 假设user_info中有userCode字段，具体字段名请根据实际OAuth2服务器调整
        username = user_info.get('userCode')
        if not username:
            logger.error(f"OAuth2用户信息缺少username: {user_info}")
            return resp_500(code=401, data={"error": "OAuth2用户信息缺少username"})
        # 3. 检查本地用户是否存在，不存在则自动注册
        user_exist = UserDao.get_unique_user_by_name(username)
        if not user_exist:
            email = user_info.get('email') or f"{username}@globalymc.com"
            user_create = UserCreate(
                user_name=username,
                password="",  # OAuth2无需密码
                email=email,
                realname=username,
                captcha="",
                captcha_key=""
            )
            user_exist = User.model_validate(user_create)
            user_all = UserDao.get_all_users(page=1, limit=1)
            default_admin = settings.get_system_login_method().admin_username
            if len(user_all) == 0 or (default_admin and default_admin == username):
                user_exist = UserDao.add_user_and_admin_role(user_exist)
            else:
                user_exist = UserDao.add_user_and_default_role(user_exist)
            UserGroupDao.add_default_user_group(user_exist.user_id)
        # 4. 生成JWT令牌
        access_token_jwt, refresh_token, role, _ = gen_user_jwt(user_exist)
        # 5. 设置登录会话
        redis_client.set(
            USER_CURRENT_SESSION.format(user_exist.user_id),
            access_token_jwt,
            ACCESS_TOKEN_EXPIRE_TIME + 3600
        )
        # 6. 记录审计日志
        from bisheng.api.services.user_service import UserPayload
        AuditLogService.user_login(UserPayload(**{
            'user_name': user_exist.user_name,
            'user_id': user_exist.user_id,
            'role': role
        }), get_request_ip(request))
        # 7. 返回令牌信息
        return resp_200({
            "access_token": access_token_jwt,
            "refresh_token": refresh_token,
            "user_name": user_exist.user_name,
            "user_id": user_exist.user_id,
            "role": role
        })
    except Exception as e:
        logger.exception(f"OAuth2验证过程中发生错误: {e}")
        return resp_500(code=500, data={"error": f"验证过程中发生错误: {str(e)}"}) 