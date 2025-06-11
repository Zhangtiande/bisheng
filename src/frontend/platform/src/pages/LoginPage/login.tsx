import { BookOpenIcon } from '@/components/bs-icons/bookOpen';
import { GithubIcon } from '@/components/bs-icons/github';
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import json from "../../../package.json";
import { Button } from "../../components/bs-ui/button";
import { Input } from "../../components/bs-ui/input";
// import { alertContext } from "../contexts/alertContext";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { useNavigate } from 'react-router-dom';
import { getCaptchaApi, loginApi, registerApi } from "../../controllers/API/user";
import { captureAndAlertRequestErrorHoc } from "../../controllers/request";
import LoginBridge from './loginBridge';
import { PWD_RULE, handleEncrypt, handleLdapEncrypt } from './utils';
import { locationContext } from '@/contexts/locationContext';
import { ldapLoginApi } from '@/controllers/API/pro';

export const LoginPage = () => {
    // const { setErrorData, setSuccessData } = useContext(alertContext);
    const { t, i18n } = useTranslation();
    const { message, toast } = useToast()
    const navigate = useNavigate()
    const { appConfig } = useContext(locationContext)

    const isLoading = false

    const mailRef = useRef(null)
    const pwdRef = useRef(null)
    const agenPwdRef = useRef(null)

    // login or register
    const [showLogin, setShowLogin] = useState(true)

    // captcha
    const captchaRef = useRef(null)
    const [captchaData, setCaptchaData] = useState({ captcha_key: '', user_capthca: false, captcha: '' });

    useEffect(() => {
        fetchCaptchaData();
    }, []);

    const fetchCaptchaData = () => {
        getCaptchaApi().then(setCaptchaData)
    };

    const [isLDAP, setIsLDAP] = useState(false)
    const handleLogin = async () => {
        const error = []
        const [mail, pwd] = [mailRef.current.value, pwdRef.current.value]
        if (!mail) error.push(t('login.pleaseEnterAccount'))
        if (!pwd) error.push(t('login.pleaseEnterPassword'))
        if (captchaData.user_capthca && !captchaRef.current.value) error.push(t('login.pleaseEnterCaptcha'))
        if (error.length) return message({
            title: `${t('prompt')}`,
            variant: 'warning',
            description: error
        })
        // if (error.length) return setErrorData({
        //     title: `${t('prompt')}:`,
        //     list: error,
        // });

        const encryptPwd = isLDAP ? await handleLdapEncrypt(pwd) : await handleEncrypt(pwd)
        captureAndAlertRequestErrorHoc(
            (isLDAP
                ? ldapLoginApi(mail, encryptPwd)
                : loginApi(mail, encryptPwd, captchaData.captcha_key, captchaRef.current?.value)
            ).then((res: any) => {
                window.self === window.top ? localStorage.removeItem('ws_token') : localStorage.setItem('ws_token', res.access_token)
                localStorage.setItem('isLogin', '1')
                const path = location.href.indexOf('from=workspace') === -1 ? '' : '/workspace/'
                location.href = path ? location.origin + path : location.href
                // location.href = __APP_ENV__.BASE_URL + '/'

            }), (error) => {
                if (error.indexOf('过期') !== -1) { // 有时间改为 code 判断
                    localStorage.setItem('account', mail)
                    navigate('/reset', { state: { noback: true } })
                }
            })

        fetchCaptchaData()
    }

    const handleRegister = async () => {
        const error = []
        const [mail, pwd, apwd] = [mailRef.current.value, pwdRef.current.value, agenPwdRef.current.value]
        if (!mail) {
            error.push(t('login.pleaseEnterAccount'))
        }
        if (mail.length < 3) {
            error.push(t('login.accountTooShort'))
        }
        if (!/.{8,}/.test(pwd)) {
            error.push(t('login.passwordTooShort'))
        }
        if (!PWD_RULE.test(pwd)) {
            error.push(t('login.passwordError'))
        }
        if (pwd !== apwd) {
            error.push(t('login.passwordMismatch'))
        }
        if (captchaData.user_capthca && !captchaRef.current.value) {
            error.push(t('login.pleaseEnterCaptcha'))
        }
        if (error.length) {
            return message({
                title: `${t('prompt')}`,
                variant: 'warning',
                description: error
            })
        }
        const encryptPwd = await handleEncrypt(pwd)
        captureAndAlertRequestErrorHoc(registerApi(mail, encryptPwd, captchaData.captcha_key, captchaRef.current?.value).then(res => {
            // setSuccessData({ title: t('login.registrationSuccess') })
            message({
                title: `${t('prompt')}`,
                variant: 'success',
                description: [t('login.registrationSuccess')]
            })
            pwdRef.current.value = ''
            setShowLogin(true)
        }))

        fetchCaptchaData()
    }

    return <div
        className='w-full h-full bg-cover bg-center flex justify-center items-center'
        style={{
            backgroundImage: `url(${__APP_ENV__.BASE_URL}/login.png)`
        }}
    >
        <div className='z-10 sm:w-[480px] w-full p-10 border rounded-lg shadow-2xl overflow-hidden bg-gray-50/70 relative backdrop-blur'>
            <div className='w-full h-full relative z-10'>
                <div className="relative p-6 mb-4 rounded-lg">
                    <div className="relative z-10 w-fit m-auto">
                        <img src={__APP_ENV__.BASE_URL + '/login-logo-small.png'} className="block w-auto h-[68px] dark:hidden bg-blue-900 rounded-lg shadow-lg p-3" alt="" />
                        <img src={__APP_ENV__.BASE_URL + '/logo-small-dark.png'} className="w-auto h-[48px] hidden dark:block bg-blue-900/20 rounded-lg shadow-lg p-3" alt="" />
                    </div>
                </div>
                <span className='block w-fit m-auto font-normal text-[14px] text-tx-color mt-[24px]'>{t('login.slogen')}</span>
                <div className="grid gap-[12px] mt-[68px]">
                    <div className="grid">
                        <Input
                            id="email"
                            className='h-[48px] bg-white/90 dark:bg-login-input border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                            ref={mailRef}
                            placeholder={t('login.account')}
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                        />
                    </div>
                    <div className="grid">
                        <Input
                            id="pwd"
                            className='h-[48px] bg-white/90 dark:bg-login-input border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                            ref={pwdRef}
                            placeholder={t('login.password')}
                            type="password"
                            onKeyDown={e => e.key === 'Enter' && showLogin && handleLogin()} />
                    </div>
                    {
                        !showLogin && <div className="grid">
                            <Input id="pwd"
                                className='h-[48px] bg-white/90 dark:bg-login-input border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                                ref={agenPwdRef}
                                placeholder={t('login.confirmPassword')}
                                type="password" />
                        </div>
                    }
                    {
                        captchaData.user_capthca && (<div className="flex items-center gap-4">
                            <Input
                                type="text"
                                ref={captchaRef}
                                placeholder={t('login.pleaseEnterCaptcha')}
                                className="h-[48px] bg-white/90 dark:bg-login-input px-4 border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                            />
                            <img
                                src={'data:image/jpg;base64,' + captchaData.captcha} // 这里应该是你的验证码图片的URL
                                alt="captcha"
                                onClick={fetchCaptchaData} // 这里应该是你的刷新验证码函数
                                className="cursor-pointer h-[48px] bg-white/90 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                                style={{ width: '120px' }} // 根据需要调整宽度
                            />
                        </div>
                        )
                    }
                    {
                        showLogin ? <>
                            <div className="text-center">
                                {!isLDAP && appConfig.register && <a href="javascript:;" className=" text-blue-500 text-sm hover:underline" onClick={() => setShowLogin(false)}>{t('login.noAccountRegister')}</a>}
                            </div>
                            <Button
                                className='h-[48px] mt-[32px] bg-blue-900 hover:bg-blue-800 dark:bg-button'
                                disabled={isLoading} onClick={handleLogin} >{t('login.loginButton')}</Button>
                        </> :
                            <>
                                <div className="text-center">
                                    <a href="javascript:;" className=" text-blue-500 text-sm hover:underline" onClick={() => setShowLogin(true)}>{t('login.haveAccountLogin')}</a>
                                </div>
                                <Button
                                    className='h-[48px] mt-[32px]  bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-md hover:shadow-lg transition-all'
                                    disabled={isLoading} onClick={handleRegister} >{t('login.registerButton')}</Button>
                            </>
                    }
                    {appConfig.isPro && <LoginBridge onHasLdap={setIsLDAP} />}
                </div>
            </div>
        </div>
    </div>
};