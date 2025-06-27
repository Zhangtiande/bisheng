import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import axios from '@/controllers/request';
import lodash from "lodash";

/**
 * OAuth2 回调处理组件
 * 用于处理OAuth2服务器重定向回来后的授权码换取token
 */
const OAuth2Callback = () => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // 从URL中获取code参数
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) {
            setStatus('error');
            setErrorMessage(t('login.noCodeFound') || '未在URL中找到授权码');
            return;
        }
        // 使用lodash防抖函数防止重复调用
        const debouncedVerifyTicket = lodash.debounce((ticketParam: string) => {
            axios.post('/api/oauth2/token', { code })
                .then((response: any) => {
                    if (response && response.access_token) {
                        document.cookie = `access_token_cookie=${response.access_token}; path=/;  SameSite=Lax`;
                        document.cookie = `refresh_token_cookie=${response.refresh_token}; path=/;  SameSite=Lax`;
                        localStorage.setItem('isLogin', '1');
                        setStatus('success');
                        // 跳转到首页或工作台
                        const path = location.href.indexOf('from=workspace') === -1 ? '' : '/workspace/';
                        const redirectUrl = path ? location.origin + path : '/';
                        window.location.href = redirectUrl;
                    } else {
                        setStatus('error');
                        setErrorMessage(t('login.oauth2TokenError') || '未获取到token');
                    }
                })
                .catch((error) => {
                    setStatus('error');
                    setErrorMessage(typeof error === 'string' ? error : (error.message || t('login.oauth2TokenError')));
                });
        }, 300);
        debouncedVerifyTicket(code);
        return () => {
            debouncedVerifyTicket.cancel();
        };
    }, [t]);

    return (
        <div className='w-full h-full flex items-center justify-center'>
            <div className='p-8 rounded-lg shadow-md bg-white text-center'>
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">{t('login.authenticating') || '认证中...'}</h2>
                        <p>{t('login.verifyingCredentials') || '正在验证您的OAuth2凭证'}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="h-8 w-8 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('login.authenticationSuccess') || '认证成功！'}</h2>
                        <p>{t('login.redirecting') || '正在跳转到首页...'}</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="h-8 w-8 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('login.authenticationFailed') || '认证失败'}</h2>
                        <p>{errorMessage}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            {t('login.backToLogin') || '返回登录'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default OAuth2Callback; 