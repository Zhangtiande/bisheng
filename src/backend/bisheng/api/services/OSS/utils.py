"""OSS服务通用工具模块"""
import requests
from typing import Dict, Any, Optional, Union
from loguru import logger


class RequestHandler:
    """通用HTTP请求处理器，统一异常处理逻辑"""
    
    @staticmethod
    def handle_get_request(
        url: str, 
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        operation_name: str = "GET request"
    ) -> requests.Response:
        """统一处理GET请求的异常
        
        Args:
            url: 请求URL
            params: 查询参数
            headers: 请求头
            timeout: 请求超时时间（秒）
            operation_name: 操作名称，用于日志记录
            
        Returns:
            requests.Response对象
            
        Raises:
            requests.RequestException: 网络请求异常
            requests.Timeout: 请求超时异常
            requests.HTTPError: HTTP状态码异常
        """
        try:
            logger.debug(f"Sending {operation_name} to {url}")
            response = requests.get(
                url, 
                params=params, 
                headers=headers, 
                timeout=timeout
            )
            logger.debug(f"{operation_name} success: {response.status_code}")
            return response
            
        except requests.Timeout as e:
            logger.error(f"{operation_name} timeout: {url}, error: {e}")
            raise requests.Timeout("请求超时，请检查网络连接或服务器状态")
        except requests.ConnectionError as e:
            logger.error(f"{operation_name} connection error: {url}, error: {e}")
            raise Exception("连接失败，请确认URL是否正确")
        except requests.HTTPError as e:
            logger.error(f"{operation_name} HTTP error: {response.status_code} - {response.text}")
            raise requests.HTTPError(f"HTTP错误: {response.status_code}")
        except requests.RequestException as e:
            logger.error(f"{operation_name} failed: {url}, error: {e}")
            raise requests.RequestException(f"请求失败: {str(e)}")
    
    @staticmethod
    def handle_post_request(
        url: str,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        operation_name: str = "POST request"
    ) -> requests.Response:
        """统一处理POST请求的异常
        
        Args:
            url: 请求URL
            data: 表单数据
            json_data: JSON数据
            headers: 请求头
            timeout: 请求超时时间（秒）
            operation_name: 操作名称，用于日志记录
            
        Returns:
            requests.Response对象
            
        Raises:
            requests.RequestException: 网络请求异常
            requests.Timeout: 请求超时异常
            requests.HTTPError: HTTP状态码异常
        """
        try:
            logger.debug(f"Sending {operation_name} to {url}")
            response = requests.post(
                url,
                data=data,
                json=json_data,
                headers=headers,
                timeout=timeout
            )
            response.raise_for_status()
            logger.debug(f"{operation_name} success: {response.status_code}")
            return response
            
        except requests.Timeout as e:
            logger.error(f"{operation_name} timeout: {url}, error: {e}")
            raise requests.Timeout(f"请求超时，请检查网络连接或服务器状态")
        except requests.ConnectionError as e:
            logger.error(f"{operation_name} connection error: {url}, error: {e}")
            raise requests.ConnectionError(f"连接失败，请确认URL是否正确: {url}")
        except requests.HTTPError as e:
            logger.error(f"{operation_name} HTTP error: {response.status_code} - {response.text}")
            raise requests.HTTPError(f"HTTP错误: {response.status_code}")
        except requests.RequestException as e:
            logger.error(f"{operation_name} failed: {url}, error: {e}")
            raise requests.RequestException(f"请求失败: {str(e)}")
    
    @staticmethod
    def handle_put_request(
        url: str,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        operation_name: str = "PUT request"
    ) -> requests.Response:
        """统一处理PUT请求的异常
        
        Args:
            url: 请求URL
            data: 表单数据
            json_data: JSON数据
            headers: 请求头
            timeout: 请求超时时间（秒）
            operation_name: 操作名称，用于日志记录
            
        Returns:
            requests.Response对象
            
        Raises:
            requests.RequestException: 网络请求异常
            requests.Timeout: 请求超时异常
            requests.HTTPError: HTTP状态码异常
        """
        try:
            logger.debug(f"Sending {operation_name} to {url}")
            response = requests.put(
                url,
                data=data,
                json=json_data,
                headers=headers,
                timeout=timeout
            )
            response.raise_for_status()
            logger.debug(f"{operation_name} success: {response.status_code}")
            return response
            
        except requests.Timeout as e:
            logger.error(f"{operation_name} timeout: {url}, error: {e}")
            raise requests.Timeout(f"请求超时，请检查网络连接或服务器状态")
        except requests.ConnectionError as e:
            logger.error(f"{operation_name} connection error: {url}, error: {e}")
            raise requests.ConnectionError(f"连接失败，请确认URL是否正确: {url}")
        except requests.HTTPError as e:
            logger.error(f"{operation_name} HTTP error: {response.status_code} - {response.text}")
            raise requests.HTTPError(f"HTTP错误: {response.status_code}")
        except requests.RequestException as e:
            logger.error(f"{operation_name} failed: {url}, error: {e}")
            raise requests.RequestException(f"请求失败: {str(e)}")
    
    @staticmethod
    def handle_delete_request(
        url: str,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        operation_name: str = "DELETE request"
    ) -> requests.Response:
        """统一处理DELETE请求的异常
        
        Args:
            url: 请求URL
            headers: 请求头
            timeout: 请求超时时间（秒）
            operation_name: 操作名称，用于日志记录
            
        Returns:
            requests.Response对象
            
        Raises:
            requests.RequestException: 网络请求异常
            requests.Timeout: 请求超时异常
            requests.HTTPError: HTTP状态码异常
        """
        try:
            logger.debug(f"Sending {operation_name} to {url}")
            response = requests.delete(
                url,
                headers=headers,
                timeout=timeout
            )
            response.raise_for_status()
            logger.debug(f"{operation_name} success: {response.status_code}")
            return response
            
        except requests.Timeout as e:
            logger.error(f"{operation_name} timeout: {url}, error: {e}")
            raise requests.Timeout(f"请求超时，请检查网络连接或服务器状态")
        except requests.ConnectionError as e:
            logger.error(f"{operation_name} connection error: {url}, error: {e}")
            raise requests.ConnectionError(f"连接失败，请确认URL是否正确: {url}")
        except requests.HTTPError as e:
            logger.error(f"{operation_name} HTTP error: {response.status_code} - {response.text}")
            raise requests.HTTPError(f"HTTP错误: {response.status_code}")
        except requests.RequestException as e:
            logger.error(f"{operation_name} failed: {url}, error: {e}")
            raise requests.RequestException(f"请求失败: {str(e)}")
    
    @staticmethod
    def safe_request(
        method: str,
        url: str,
        return_on_error: Any = None,
        raise_on_error: bool = False,
        **kwargs
    ) -> Union[requests.Response, Any]:
        """安全的请求方法，可以选择在错误时返回默认值而不是抛出异常
        
        Args:
            method: HTTP方法 (GET, POST, PUT, DELETE)
            url: 请求URL
            return_on_error: 发生错误时返回的默认值
            raise_on_error: 是否在错误时抛出异常
            **kwargs: 传递给requests方法的其他参数
            
        Returns:
            成功时返回Response对象，失败时返回return_on_error值
        """
        method = method.upper()
        operation_name = kwargs.pop('operation_name', f"{method} request")
        
        try:
            if method == 'GET':
                return RequestHandler.handle_get_request(url, operation_name=operation_name, **kwargs)
            elif method == 'POST':
                return RequestHandler.handle_post_request(url, operation_name=operation_name, **kwargs)
            elif method == 'PUT':
                return RequestHandler.handle_put_request(url, operation_name=operation_name, **kwargs)
            elif method == 'DELETE':
                return RequestHandler.handle_delete_request(url, operation_name=operation_name, **kwargs)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
        except Exception as e:
            if raise_on_error:
                raise
            logger.warning(f"Request failed, returning default value: {return_on_error}")
            return return_on_error


class ResponseHelper:
    """响应处理辅助类"""
    
    @staticmethod
    def is_success_status(status_code: int) -> bool:
        """判断状态码是否表示成功"""
        return 200 <= status_code < 300
    
    @staticmethod
    def extract_json_safely(response: requests.Response, default: Any = None) -> Any:
        """安全地提取JSON数据"""
        try:
            return response.json()
        except (ValueError, requests.exceptions.JSONDecodeError) as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            return default
    
    @staticmethod
    def get_error_message(response: requests.Response) -> str:
        """从响应中提取错误信息"""
        try:
            # 尝试从JSON响应中获取错误信息
            json_data = response.json()
            if isinstance(json_data, dict):
                # 常见的错误字段名
                for field in ['error', 'message', 'msg', 'detail', 'description']:
                    if field in json_data:
                        return str(json_data[field])
            return f"HTTP {response.status_code}: {response.text[:200]}"
        except:
            return f"HTTP {response.status_code}: {response.text[:200]}"


# 使用示例：
"""
# 基本用法
try:
    response = RequestHandler.handle_get_request(
        "https://api.example.com/data",
        params={"key": "value"},
        headers={"Authorization": "Bearer token"},
        timeout=10,
        operation_name="获取用户数据"
    )
    data = ResponseHelper.extract_json_safely(response)
    print(data)
except requests.RequestException as e:
    print(f"请求失败: {e}")

# 安全请求用法（不抛出异常）
response = RequestHandler.safe_request(
    "GET",
    "https://api.example.com/data",
    return_on_error={"error": "请求失败"},
    raise_on_error=False,
    timeout=5
)

# POST请求示例
try:
    response = RequestHandler.handle_post_request(
        "https://api.example.com/create",
        json_data={"name": "test", "value": 123},
        headers={"Content-Type": "application/json"},
        operation_name="创建资源"
    )
    if ResponseHelper.is_success_status(response.status_code):
        print("创建成功")
    else:
        error_msg = ResponseHelper.get_error_message(response)
        print(f"创建失败: {error_msg}")
except requests.RequestException as e:
    print(f"请求异常: {e}")
"""
