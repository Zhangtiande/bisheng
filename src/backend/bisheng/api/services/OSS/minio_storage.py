from bisheng.api.services.OSS import BaseObjectStorage
from bisheng.database.models.knowledge import StorageTypeEnum
from bisheng.database.models.knowledge_file import KnowledgeFile
from bisheng.utils.minio_client import MinioClient
from loguru import logger


class MinioStorage(BaseObjectStorage):
    """MinIO对象存储实现"""
    storage_type = StorageTypeEnum.MINIO.value

    
    def __init__(self, config: dict = None):
        """初始化MinIO存储
        
        Args:
            config: MinIO配置，如果为None则使用默认配置
        """
        # 如果有自定义配置，可以在这里处理
        # 目前直接使用现有的MinioClient
        self.client = MinioClient()
    
    def get_share_link(self, db_file: KnowledgeFile) -> bool:
        """上传文件"""
        try:
            path = self.client.get_share_link(db_file.object_name)
            logger.info(f"MinIO get_share_link success: {db_file.object_name}")
            return path
        except Exception as e:
            logger.error(f"MinIO upload_file failed: {db_file.object_name}, error: {e}")
            return None
    
    
    def delete_file(self, db_file: KnowledgeFile) -> bool:
        """删除文件"""
        try:
            self.client.delete_minio(str(db_file.id))
            if db_file.object_name:
                self.client.delete_minio(db_file.object_name)
            logger.info(f"MinIO delete_file success: {db_file.object_name}")
            return True
        except Exception as e:
            logger.error(f"MinIO delete_file failed: {db_file.object_name}, error: {e}")
            return False
    