import json
import os
from typing import Dict, Any, Optional

import requests
from bisheng.api.services.OSS import BaseObjectStorage
from bisheng.api.services.OSS.utils import RequestHandler, ResponseHelper
from bisheng.database.models.knowledge import StorageTypeEnum
from bisheng.database.models.knowledge_file import KnowledgeFile
from loguru import logger

from bisheng.utils.minio_client import MinioClient


class CMS3Client:
    """CMS3.0客户端实现"""
    LOGIN_URL = "/alfresco/s/api/login"
    DELETE_URL = "/alfresco/s/sharepm/common/removeToRecycle"
    GET_SHARE_LINK_URL = "/alfresco/s/api/node/content/workspace/SpacesStore"
    
    def __init__(self):
        self._ticket: Optional[str] = None
        self.uri: str = ""
        self.site_short_name: str = ""
        self.username: str = ""
        self.password: str = ""
        
    @property
    def ticket(self) -> Optional[str]:
        return self._ticket
    
    def create(self, config: Dict[str, Any], uri: str):
        """创建CMS3客户端"""
        self.uri = uri
        self.site_short_name = config.get('siteShortName', '')
        self.username = config.get('username', '')
        self.password = config.get('password', '')
        self.get_ticket()
        return self
    
    def get_ticket(self) -> None:
        """获取认证票据"""
        login_url = f"{self.uri}{self.LOGIN_URL}?u={self.username}&pw={self.password}&format=json"
        
        response = RequestHandler.handle_get_request(
            login_url, 
            timeout=3,
            operation_name="CMS3 login"
        )
        
        data = ResponseHelper.extract_json_safely(response, {})
        if response.status_code == 200:
            self._ticket = data.get('data', {}).get('ticket')
            logger.info("CMS3 login success, got ticket")
        elif response.status_code == 403:
            raise Exception("知识库CMS3.0用户名或密码错误")
        else:
            raise Exception(f"CMS3.0登录失败，状态码: {response.status_code}")
                

    
    def delete_node(self, node_id: str) -> bool:
        """删除CMS3节点"""
        delete_url = f"{self.uri}{self.DELETE_URL}"
        
        data = {
            'shortName': self.site_short_name,
            'itemIds': [node_id]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Share-Token': self._ticket
        }
        
        try:
            response = RequestHandler.handle_post_request(
                delete_url,
                json_data=data,
                headers=headers,
                operation_name=f"CMS3 delete node {node_id}"
            )
            
            if ResponseHelper.is_success_status(response.status_code):
                logger.info(f"CMS3 delete success: {node_id}")
                return True
            else:
                error_msg = ResponseHelper.get_error_message(response)
                logger.error(f"删除失败: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"CMS3 delete failed: {node_id}, error: {e}")
            return False
        
    def get_share_link(self, node_id: str) -> str:
        """获取分享链接"""
        return f"{self.uri}{self.GET_SHARE_LINK_URL}/{node_id}?a=true&alf_ticket={self._ticket}"


class CMS3_0Storage(BaseObjectStorage):
    """CMS3.0对象存储实现"""
    storage_type = StorageTypeEnum.CMS_3_0.value

    def __init__(self, config: dict = None):
        """初始化CMS3存储

        Args:
            config: CMS3配置，包含username, password, host, port, siteShortName
        """
        self.config = config or {}

        # 验证必要的配置项
        required_fields = ["username", "password", "host", "port", "rootNodeRef"]
        for field in required_fields:
            if field not in self.config or not self.config[field]:
                raise Exception("知识库配置缺少必要字段" + field)
            
        self.client = self._get_client()
        
        
    def _get_cms3_uri(self) -> str:
        """构建CMS3的URI"""
        host = self.config.get('host', '')
        port = self.config.get('port', '')
        if port:
            return f"http://{host}:{port}"
        return f"http://{host}"
    
    
    def _get_client(self) -> CMS3Client:
        """获取CMS3客户端实例"""
        try:
            self.client = CMS3Client()
            uri = self._get_cms3_uri()
            self.client.create(self.config, uri)
            logger.info(f"CMS3 client created successfully for {uri}")
        except Exception as e:
            logger.error(f"Failed to create CMS3 client: {e}")
            raise e
        return self.client

    def get_share_link(self, db_file: KnowledgeFile) -> str:
        """上传文件"""
        try:
            client = self._get_client()
            extra_meta = json.loads(db_file.extra_meta)
            path = client.get_share_link(extra_meta.get('node_id'))
            logger.info(f"CMS3 get_share_link success: {db_file.file_name}")
            return path
            
        except Exception as e:
            logger.error(f"CMS3 get_share_link failed: {db_file.file_name}, error: {e}")
            raise
    
    def get_share_link_by_node_id(self, node_id: str) -> str:
        """获取分享链接"""
        try:
            path = self.client.get_share_link(node_id)
            logger.info(f"CMS3 get_share_link success: {node_id}")
            return path
        except Exception as e:
            logger.error(f"CMS3 get_share_link failed: {node_id}, error: {e}")
            raise
    
    def delete_file(self, db_file: KnowledgeFile) -> bool:
        """删除文件"""
        try:
            client = self._get_client()
            extra_meta = json.loads(db_file.extra_meta)
            minio_client = MinioClient()
      
            minio_client.delete_minio(str(db_file.id))
            # 删除主文件节点
            success = client.delete_node(extra_meta.get('node_id'))
            
            return success
            
        except Exception as e:
            logger.error(f"CMS3 delete_file failed: {db_file.file_name}, error: {e}")
            return False
