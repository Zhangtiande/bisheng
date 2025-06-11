import axios from "../request";

/**
 * 保存敏感词
 */
export const sensitiveSaveApi = async (data: any): Promise<any> => {
    const { id, type, isCheck, words, wordsType, autoReply } = data

    return await axios.post(`/api/sensitive/saveWords`, {
        resource_id: id,
        resource_type: type,
        is_check: isCheck,
        words,
        words_type: wordsType,
        auto_reply: autoReply
    });
};

/**
 * 获取敏感词配置
 */
export const getSensitiveApi = async (resourceId, resourceType): Promise<any> => {

    return await axios.get(`/api/sensitive/wordsDetail`, {
        params: {
            resourceId,
            resourceType
        }
    });
};

/**
 * 获取资源组流量
 */
export const getGroupFlowsApi = async (page: number, pageSize: number, resourceType: string, groupId: number, name: string): Promise<any> => {
    if (!groupId) return Promise.resolve([{ data: [], total: 0 }]);
    return await axios.get(`/api/resource/groupFlows`, {
        params: {
            name,
            page,
            pageSize,
            resourceType,
            groupId
        }
    });
};


/**
 * 保存组信息
 */
export const saveGroupApi = async (data: any): Promise<any> => {
    const { id,
        groupLimit: group_limit,
        adminUser: admin_user,
        adminUserId: admin_user_id,
        groupName: group_name,
        assistant,
        workFlows,
        skill } = data;
    // const {resourceId, groupId, resourceLimit} = assistant

    return await axios.post(`/api/group/save`, {
        id,
        group_limit,
        admin_user,
        admin_user_id,
        group_name,
        assistant,
        skill,
        work_flows: workFlows
    });
};

// 用户组列表
export function getUserGroupsProApi() {
    return axios.get(`/api/group/list`);
}

// GET sso URL - 获取SSO URL和相关配置
export function getSSOurlApi() {
    return axios.get(`/api/cas/list`)
        .then(response => {
            // 确保返回的数据包含必要的CAS参数
            // 如果后端没有提供完整的CAS配置，前端可以使用这些默认值
            return {
                ...response,
                // 确保serviceUrl存在，用于CAS登录流程
                serviceUrl: response.serviceUrl || window.location.origin + '/cas-callback'
            };
        });
}

/**
 * CAS登录验证
 * 用于处理CAS登录回调，验证票据
 * @param ticket CAS登录后返回的票据
 */
export const verifyCasTicketApi = (ticket) => {
    return axios.get(`/api/cas/ticket/verify?ticket=${ticket}`);
};

export async function getKeyApi() {
    return await axios.get('/api/getkey')
}

export async function ldapLoginApi(username:string, password:string) {
    return await axios.post('/api/oauth2/ldap', {
        username,
        password
    })
}