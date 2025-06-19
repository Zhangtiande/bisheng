from bisheng.api.services.OSS import BaseObjectStorage
from bisheng.api.services.OSS.CMS2_storage import CMS2_0Storage
from bisheng.api.services.OSS.CMS3_storage import CMS3_0Storage
from bisheng.api.services.OSS.minio_storage import MinioStorage
from bisheng.database.models.knowledge import Knowledge, StorageTypeEnum
from loguru import logger


def create_object_storage(storage_type: int = 0, config: dict = None) -> BaseObjectStorage:
    """创建对象存储实例
    
    Args:
        storage_type: 存储类型，目前支持 'minio'
        config: 存储配置
        
    Returns:
        BaseObjectStorage: 对象存储实例
        
    Raises:
        ValueError: 不支持的存储类型
    """
    if storage_type == StorageTypeEnum.MINIO.value:
        return MinioStorage(config)
    elif storage_type == StorageTypeEnum.CMS_2_0.value:
        return CMS2_0Storage(config)
    elif storage_type == StorageTypeEnum.CMS_3_0.value:
        return CMS3_0Storage(config)
    else:
        raise ValueError(f"Unsupported storage type: {storage_type}")


def decide_object_storage(knowledge: Knowledge) -> BaseObjectStorage:
    """根据知识库配置决定使用哪种对象存储
    
    Args:
        knowledge: 知识库对象
        
    Returns:
        BaseObjectStorage: 对象存储实例
    """
    # 如果知识库配置了特定的存储，使用特定配置
    storage_type = knowledge.storage_type
    config = knowledge.storage_config
    
    logger.info(f"Using custom storage for knowledge {knowledge.id}: {storage_type}")
    return create_object_storage(storage_type, config)

def decide_object_storage_by_config(storage_type: int, config: dict) -> BaseObjectStorage:
    """根据知识库配置决定使用哪种对象存储

    Args:
        storage_type: 存储类型
        config: 存储配置

    Returns:
        BaseObjectStorage: 对象存储实例
    """
    # 如果知识库配置了特定的存储，使用特定配置
    logger.info(f"Using custom storage for knowledge {config.get('id')}: {storage_type}")
    return create_object_storage(storage_type, config)