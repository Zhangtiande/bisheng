from abc import ABC, abstractmethod

from bisheng.database.models.knowledge_file import KnowledgeFile

class BaseObjectStorage(ABC):
    """对象存储基类"""

    @abstractmethod
    def get_share_link(
        self,
        db_file: KnowledgeFile,
    ) -> str:
        """上传文件

        Args:
            db_file: 数据库文件对象

        Returns:
            str: 分享链接
        """
        pass


    @abstractmethod
    def delete_file(self, db_file: KnowledgeFile) -> bool:
        """删除文件

        Args:
            db_file: 数据库文件对象

        Returns:
            bool: 删除是否成功
        """
        pass

