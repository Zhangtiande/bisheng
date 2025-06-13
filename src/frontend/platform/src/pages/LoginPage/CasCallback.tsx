import { verifyCasTicketApi } from "@/controllers/API/pro";
import { captureAndAlertRequestErrorHoc } from "@/controllers/request";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import lodash from "lodash";

/**
 * CAS回调处理组件
 * 用于处理CAS服务器重定向回来后的票据验证
 */
export const CasCallback = () => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // 从URL中获取ticket参数
        const urlParams = new URLSearchParams(window.location.search);
        const ticket = urlParams.get('ticket');

        if (!ticket) {
            setStatus('error');
            setErrorMessage(t('login.noTicketFound') || 'No ticket found in URL');
            return;
        }

        // 使用lodash防抖函数防止重复调用
        const debouncedVerifyTicket = lodash.debounce((ticketParam: string) => {
            setIsVerifying(true);
            // 验证CAS票据
            verifyCasTicketApi(ticketParam)
                .then((response) => {
                    if (response && response.access_token) {
                        document.cookie = `access_token_cookie=${response.access_token}; path=/;  SameSite=Lax`;
                        document.cookie = `refresh_token_cookie=${response.refresh_token}; path=/;  SameSite=Lax`;
                    } 
                    localStorage.setItem('isLogin', '1');
                    const path = location.href.indexOf('from=workspace') === -1 ? '' : '/workspace/';
                    const redirectUrl = path ? location.origin + path : '/';
                    setStatus('success');
                    location.href = redirectUrl;
                })
                .catch((error) => {
                    setStatus('error');
                    setErrorMessage(typeof error === 'string' ? error : (error.message || t('login.authenticationFailed')));
                    setIsVerifying(false);
                });
        }, 300);

        debouncedVerifyTicket(ticket);

        // 清理函数 
        return () => {
            debouncedVerifyTicket.cancel();
        };
    }, []);

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