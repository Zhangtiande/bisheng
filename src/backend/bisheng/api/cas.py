import xml.etree.ElementTree as ET
import requests
from urllib.parse import urlencode

from fastapi import APIRouter, Request, Depends, HTTPException, Query
from starlette.responses import RedirectResponse
from sqlmodel import select

from bisheng.settings import settings
from bisheng.api.v1.schemas import resp_200, resp_500
from bisheng.database.models.user import UserCreate, User
from bisheng.database.models.user import UserDao
from bisheng.utils.logger import logger
from bisheng.cache.redis import redis_client
from bisheng.utils.constants import USER_CURRENT_SESSION
from bisheng.api.services.user_service import gen_user_jwt
from bisheng.api.JWT import ACCESS_TOKEN_EXPIRE_TIME
from bisheng.api.services.audit_log import AuditLogService
from bisheng.api.utils import get_request_ip

# 路由前缀/cas
router = APIRouter(prefix='/cas', tags=['CAS'])

@router.get('/ticket/verify', tags=["CAS"])
async def verify_cas_ticket(request: Request, ticket: str = Query(..., description="CAS票据"), serviceUrl:str = Query(None, description="CAS验证后重定向URL")):
    """
    验证CAS票据，并进行登录处理
    返回JSON响应，包含令牌信息
    serviceUrl: 用于CAS验证后重定向
    """
    # 获取CAS配置
    sso_config = settings.environment.get('sso', {})
    cas_config = sso_config.get('cas', {})
    
    if not cas_config.get('enabled', False):
        return resp_500(code=400, data={"error": "CAS单点登录未启用"})
    
    # 获取配置
    validate_url = cas_config.get('validate_url')
    service_url = cas_config.get('service_url')
    if serviceUrl:
        service_url = serviceUrl
    default_email_format = cas_config.get('default_email_format', '{username}@example.com')
    
    if not validate_url or not service_url:
        logger.error("CAS配置不完整，验证URL或服务URL缺失")
        return resp_500(code=500, data={"error": "CAS配置不完整"})
    
    # 验证票据
    try:
        # 构建验证请求参数
        params = {
            "service": f"{service_url}",
            "ticket": ticket
        }
        
        # 发送验证请求
        response = requests.get(validate_url, params=params)
        if response.status_code != 200:
            logger.error(f"CAS票据验证失败，状态码: {response.status_code}")
            return resp_500(code=401, data={"error": "CAS票据验证失败"})
        
        # 解析XML响应
        root = ET.fromstring(response.text)
        ns = {"cas": "http://www.yale.edu/tp/cas"}
        
        # 检查是否验证成功
        success_elem = root.find(".//cas:authenticationSuccess", ns)
        if success_elem is None:
            error_elem = root.find(".//cas:authenticationFailure", ns)
            error_code = error_elem.get("code", "UNKNOWN") if error_elem is not None else "UNKNOWN"
            error_msg = error_elem.text if error_elem is not None else "未知错误"
            logger.error(f"CAS票据验证失败: {error_code} - {error_msg}")
            return resp_500(code=401, data={"error": f"认证失败: {error_msg}"})
        
        # 获取用户名
        username = root.find(".//cas:user", ns).text
        # Extract the VP number from the username format
        if '&' in username:
            parts = username.split('&')
            for part in parts:
                if part.startswith('VP'):
                    username = part
                    break
        
        logger.info(f"CAS extracted username: {username} from original response")
        logger.info(f"CAS票据验证成功，用户名: {username}")
        
        # 查询用户是否存在
        user_exist = UserDao.get_unique_user_by_name(username)
        if not user_exist:
            # 自动创建用户
            email = default_email_format.replace('{username}', username)
            user_create = UserCreate(
                user_name=username,
                password="",  # CAS认证不需要密码
                email=email,
                realname=username,
                captcha="",
                captcha_key=""
            )
            user_exist = User.model_validate(user_create)
            
            # 判断下平台是否存在用户
            user_all = UserDao.get_all_users(page=1, limit=1)
            default_admin = settings.get_system_login_method().admin_username
            
            # 如果平台没有用户或者用户名和配置的管理员用户名一致，则插入为超级管理员
            if len(user_all) == 0 or (default_admin and default_admin == username):
                user_exist = UserDao.add_user_and_admin_role(user_exist)
            else:
                user_exist = UserDao.add_user_and_default_role(user_exist)
            
            # 将用户添加到默认用户组
            from bisheng.database.models.user_group import UserGroupDao
            UserGroupDao.add_default_user_group(user_exist.user_id)
        
        # 生成JWT令牌
        access_token, refresh_token, role, _ = gen_user_jwt(user_exist)
        
        # 设置登录会话
        redis_client.set(
            USER_CURRENT_SESSION.format(user_exist.user_id), 
            access_token, 
            ACCESS_TOKEN_EXPIRE_TIME + 3600
        )
        
        # 记录审计日志
        from bisheng.api.services.user_service import UserPayload
        AuditLogService.user_login(UserPayload(**{
            'user_name': user_exist.user_name,
            'user_id': user_exist.user_id,
            'role': role
        }), get_request_ip(request))
        
        # 返回令牌信息
        return resp_200({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_name": user_exist.user_name,
            "user_id": user_exist.user_id,
            "role": role
        })
    
    except Exception as e:
        logger.exception(f"CAS验证过程中发生错误: {e}")
        return resp_500(code=500, data={"error": f"验证过程中发生错误: {str(e)}"})

@router.get('/list', tags=["CAS"])
async def cas_list(request: Request):
    """
    获取CAS服务配置信息
    用于前端获取SSO URL和其他相关配置
    """
    # 获取SSO配置
    sso_config = settings.environment.get('sso', {})
    cas_config = sso_config.get('cas', {})
    
    # 准备返回给前端的数据
    result = {
        "sso": "",          # CAS登录URL
        "serviceUrl": ""    # CAS服务URL
    }
    
    # 如果CAS配置已启用，设置相关URL
    if cas_config.get('enabled', False):
        # 设置CAS单点登录URL
        service_url = cas_config.get('service_url', f"{request.base_url.scheme}://{request.base_url.netloc}")
        # 构建CAS登录URL，并附加service参数，用于验证后重定向
        login_url = cas_config.get('login_url')
        cas_verify_url = f"{service_url}"
        
        # 组装完整的CAS登录URL
        if login_url:
            params = {
                "service": cas_verify_url
            }
            result["sso"] = f"{login_url}?{urlencode(params)}"
        
        # 设置服务URL
        result["serviceUrl"] = service_url
        
    # 记录日志
    logger.info(f"CAS list requested, returning: {result}")
    
    return resp_200(result)