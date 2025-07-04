from typing import Any, Dict
import json
from loguru import logger

from bisheng.api.services.llm import LLMService
from bisheng.workflow.callback.event import GuideQuestionData
from bisheng.workflow.callback.llm_callback import LLMNodeCallbackHandler
from bisheng.workflow.nodes.base import BaseNode
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig


class InspirationExplorerNode(BaseNode):
    """
    灵感探索节点 - 根据用户输入和上下文生成结构化的主题探索
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._output_user = False

        # 存储日志所需数据
        self._user_input = self.node_params.get("user_prompt", "")
        self._system_prompt_used = ""
        self._user_prompt_used = ""
        self._context_used = {}
        self._reasoning_content = ""

        # 初始化llm对象
        self._llm = LLMService.get_bisheng_llm(
            model_id=self.node_params["model_id"], temperature=self.node_params.get("temperature", 0.8), cache=False
        )

    def _build_system_prompt(self) -> str:
        """构建系统提示词"""

        return """你是一个专业的主题探索助手，擅长根据用户的问题生成结构化的灵感探索内容。

你的任务是：
1. 分析用户输入的最新问题或主题
2. 结合提供的上下文信息（如果有）
3. 生成3~5个主要分类，每个分类包含3~6个相关子主题
4. 确保内容具有启发性、相关性和实用性

输出要求：
- 结构清晰，层次分明
- 每个子主题都应该是一个具体的问题或探索方向
- 内容要有深度和广度
- 避免重复，确保多样性

请确保生成的内容：
- 与原始问题高度相关
- 具有探索价值和实践意义
- 能够启发用户的深入思考
- 覆盖不同的角度和维度

——以下为示例——
用户输入： 数字人产业面临哪些技术挑战？

{
    "topics": [
        {
            "topic": "技术挑战概述",
            "subtopics": [
                "数字人产业技术挑战现状",
                "技术挑战对产业发展的影响",
            ]
        },
        {
            "topic": "具体技术挑战",
            "subtopics": [
                "口音识别准确度不足",
                "面部表情识别精准度问题",
                "自然语言处理能力有限",
                "多模态交互技术融合难度",
                "动作捕捉技术精度问题"
            ]
        },
        {
            "topic": "技术挑战原因分析",
            "subtopics": [
                "技术发展不均衡",
                "算法复杂度与计算资源限制",
                "数据标注与训练成本高",
                "跨领域技术融合难度大",
            ]
        },
        {
            "topic": "法律与道德风险",
            "subtopics": [
                "法律监管的空白与挑战",
                "道德伦理的考量",
                "如何避免侵权行为？",
                "法律责任界定问题"
            ]
        }
    ]
}

"""

    def _build_output_format_prompt(self) -> str:
        """构建输出格式说明"""
        return """
请以JSON格式返回结果：
{
    "topics": [
        {
            "topic": "主题",
            "subtopics": [
                "子主题1",
                "子主题2",
                "子主题3",
                "子主题4",
                "子主题5"
            ]
        }
    ]
}

确保返回有效的JSON格式。"""

    def _get_context_info(self) -> Dict[str, Any]:
        """获取上下文信息"""
        context_info = {}

        try:
            rag_context = self.graph_state.get_variable_by_str("global.source_documents")
            if rag_context:
                context_info["rag_context"] = [context.page_content for context in rag_context[:5]]
        except Exception as e:
            logger.warning(f"获取RAG上下文失败: {e}")

        # TODO: 获取搜索上下文

        return context_info
    
    def _get_user_input(self) -> str:
        try:
            history_list = self.graph_state.get_history_list(3)
            # 获取用户输入，返回一个列表
            formatted_history = []
            for msg in history_list:
                if msg.type != "human":
                    continue
                if hasattr(msg, "content"):
                    content = msg.content
                    if isinstance(content, list) and len(content) > 0:
                        # 处理多模态消息，只取文本部分
                        text_content = ""
                        for item in content:
                            if isinstance(item, dict) and item.get("type") == "text":
                                text_content += item.get("text", "")
                        content = text_content
                    formatted_history.append(f"用户：{content}")

            return "\n".join(formatted_history)
        except Exception as e:
            logger.warning(f"获取用户输入失败: {e}")
        return ""

    def _format_context_for_prompt(self, context_info: Dict[str, Any]) -> str:
        """将上下文信息格式化为提示词"""
        if not context_info:
            return ""

        context_text = "\n=== 参考上下文信息 ===\n"

        # 处理RAG上下文
        if "rag_context" in context_info:
            rag_data = context_info["rag_context"]
            context_text += "\n【知识库检索结果】\n"

            # 如果是字符串直接使用
            if isinstance(rag_data, str):
                context_text += rag_data[:2000] + ("..." if len(rag_data) > 2000 else "")
            # 如果是列表，提取文档内容
            elif isinstance(rag_data, list):
                for i, doc in enumerate(rag_data[:3]):  # 最多取3个文档
                    if hasattr(doc, "page_content"):
                        content = doc.page_content[:500] + ("..." if len(doc.page_content) > 500 else "")
                        context_text += f"{i + 1}. {content}\n"
                    elif isinstance(doc, dict) and "content" in doc:
                        content = doc["content"][:500] + ("..." if len(doc["content"]) > 500 else "")
                        context_text += f"{i + 1}. {content}\n"
            # 如果是字典，尝试提取内容
            elif isinstance(rag_data, dict):
                if "source_documents" in rag_data:
                    docs = rag_data["source_documents"][:3]
                    for i, doc in enumerate(docs):
                        if hasattr(doc, "page_content"):
                            content = doc.page_content[:500] + ("..." if len(doc.page_content) > 500 else "")
                            context_text += f"{i + 1}. {content}\n"
                elif "content" in rag_data:
                    content = str(rag_data["content"])[:1000] + ("..." if len(str(rag_data["content"])) > 1000 else "")
                    context_text += content

        # 处理搜索上下文
        if "search_context" in context_info:
            search_data = context_info["search_context"]
            context_text += "\n【网络搜索结果】\n"

            if isinstance(search_data, str):
                context_text += search_data[:1500] + ("..." if len(search_data) > 1500 else "")
            elif isinstance(search_data, list):
                for i, item in enumerate(search_data[:3]):
                    if isinstance(item, dict):
                        title = item.get("title", f"结果{i + 1}")
                        snippet = item.get("snippet", item.get("content", ""))[:300]
                        context_text += f"{i + 1}. {title}: {snippet}\n"
                    else:
                        context_text += f"{i + 1}. {str(item)[:300]}\n"
            elif isinstance(search_data, dict):
                if "results" in search_data:
                    for i, item in enumerate(search_data["results"][:3]):
                        title = item.get("title", f"结果{i + 1}")
                        snippet = item.get("snippet", item.get("content", ""))[:300]
                        context_text += f"{i + 1}. {title}: {snippet}\n"

        context_text += "\n=== 上下文信息结束 ===\n"
        return context_text

    def _parse_llm_output(self, output: str) -> Dict:
        """解析LLM输出"""
        try:
            # 尝试解析JSON
            cleaned_output = output.strip()
            if cleaned_output.startswith("```json"):
                cleaned_output = cleaned_output[7:]
            if cleaned_output.endswith("```"):
                cleaned_output = cleaned_output[:-3]
            cleaned_output = cleaned_output.strip()

            result = json.loads(cleaned_output)
            return result

        except Exception as e:
            logger.error(f"解析LLM输出失败: {e}")
            return {
                "error": str(e),
            }

    def _run(self, unique_id: str) -> Dict[str, Any]:
        """执行节点逻辑"""
        # 获取用户输入
        user_input = self._get_user_input()
        if not user_input:
            return {
                "inspiration_result": {"error": "未获取到用户输入"},
                "formatted_content": "❌ 错误：未获取到用户输入，请检查输入变量配置。",
            }

        # 获取上下文信息
        context_info = self._get_context_info()
        self._context_used = context_info

        # 构建提示词
        system_prompt = self._build_system_prompt()
        self._system_prompt_used = system_prompt

        context_text = self._format_context_for_prompt(context_info)
        output_format = self._build_output_format_prompt()

        user_prompt = f"""用户输入(最近3轮对话)：{user_input}

{context_text}

{output_format}"""

        self._user_prompt_used = user_prompt

        # 设置回调
        llm_callback = LLMNodeCallbackHandler(
            callback=self.callback_manager,
            unique_id=unique_id,
            node_id=self.id,
            output=self._output_user,
            output_key="inspiration_result",
        )
        config = RunnableConfig(callbacks=[llm_callback])

        # 构建消息
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]

        # 调用LLM
        result = self._llm.invoke(messages, config=config)
        self._reasoning_content = llm_callback.reasoning_content

        # 解析结果
        parsed_result = self._parse_llm_output(result.content)

        self.callback_manager.on_guide_question(GuideQuestionData(
            unique_id=unique_id,
            node_id=self.id,
            guide_question=[],
            inspiration_result=parsed_result,
        ))

        # 准备返回结果
        output_data = {
            "context_used": bool(context_info),
            "reasoning_content": self._reasoning_content,
            "inspiration_result": parsed_result,
        }

        logger.debug(f"InspirationExplorer result: {output_data}")
        return output_data

    def parse_log(self, unique_id: str, result: dict) -> Any:
        """解析日志"""
        log_data = []

        if self._reasoning_content:
            log_data.append({"key": "思考内容", "value": self._reasoning_content, "type": "params"})

        for key, value in result.items():
            log_data.append({"key": f"{self.id}.{key}", "value": value, "type": "variable"})

        return [log_data]
