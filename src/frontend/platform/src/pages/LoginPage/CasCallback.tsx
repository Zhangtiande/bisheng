import { verifyCasTicketApi } from "@/controllers/API/pro";
import { captureAndAlertRequestErrorHoc } from "@/controllers/request";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * CAS回调处理组件
 * 用于处理CAS服务器重定向回来后的票据验证
 */
export const CasCallback = () => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // 从URL中获取ticket参数
        const urlParams = new URLSearchParams(window.location.search);
        const ticket = urlParams.get('ticket');

        if (!ticket) {
            setStatus('error');
            setErrorMessage(t('login.noTicketFound') || 'No ticket found in URL');
            return;
        }

        // 添加详细的日志记录
        console.log("正在验证CAS票据:", ticket);

        // 验证CAS票据
        verifyCasTicketApi(ticket)
            .then((response) => {
                console.log("CAS验证响应:", response);
                // 验证成功，保存token并跳转
                if (response && response.access_token) {
                    const accessToken = response.access_token;
                    // 保存令牌到localStorage
                    window.self === window.top ?
                        localStorage.setItem('ws_token', accessToken) :
                        localStorage.removeItem('ws_token');
                    console.log("Token saved:", localStorage.getItem('ws_token'));

                    localStorage.setItem('isLogin', '1');

                    // 确定重定向地址
                    const path = location.href.indexOf('from=workspace') === -1 ? '' : '/workspace/';
                    const redirectUrl = path ? location.origin + path : '/';

                    // 设置状态为成功并准备跳转
                    setStatus('success');
                    setTimeout(() => {
                        location.href = redirectUrl;
                    }, 1000);
                } else {
                    console.error("CAS验证响应格式不正确:", response);
                    throw new Error('Invalid response format');
                }
            })
            .catch((error) => {
                console.error("CAS验证错误:", error);
                setStatus('error');
                setErrorMessage(typeof error === 'string' ? error : (error.message || t('login.authenticationFailed')));
            });
    }, [t]);

    return (
        <div className='w-full h-full flex items-center justify-center'>
            <div className='p-8 rounded-lg shadow-md bg-white text-center'>
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">{t('login.authenticating') || 'Authenticating...'}</h2>
                        <p>{t('login.verifyingCredentials') || 'Verifying your credentials with CAS'}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="h-8 w-8 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('login.authenticationSuccess') || 'Authentication successful!'}</h2>
                        <p>{t('login.redirecting') || 'Redirecting to dashboard...'}</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="h-8 w-8 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('login.authenticationFailed') || 'Authentication failed'}</h2>
                        <p>{errorMessage}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            {t('login.backToLogin') || 'Back to Login'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};