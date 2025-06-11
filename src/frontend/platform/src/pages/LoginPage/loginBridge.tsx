import Separator from "@/components/bs-comp/chatComponent/Separator";
import { Button } from "@/components/bs-ui/button";
import { getSSOurlApi } from "@/controllers/API/pro";
import { useEffect, useState } from "react";
//@ts-ignore
import Wxpro from "./icons/wxpro.svg?react";
import { useTranslation } from "react-i18next";

export default function LoginBridge({ onHasLdap }) {

    const { t } = useTranslation()

    const [ssoUrl, setSsoUrl] = useState<string>('')
    const [wxUrl, setWxUrl] = useState<string>('')
    const [casServiceUrl, setCasServiceUrl] = useState<string>('')

    useEffect(() => {
        // 获取SSO URL，包括CAS配置
        getSSOurlApi().then((urls: any) => {
            setSsoUrl(urls.sso)
            setWxUrl(urls.wx)
            // 保存CAS服务URL，可能需要在跳转时使用
            setCasServiceUrl(urls.serviceUrl || 'http://localhost:3001')
            urls.ldap && onHasLdap(true)
        }).catch(error => {
            console.error("获取SSO URL失败:", error);
        })
    }, [])

    // 处理CAS登录跳转，确保使用正确的service参数
    const handleCASLogin = () => {
        // 如果后端已经提供了完整的URL，直接使用
        if (ssoUrl && ssoUrl.includes('service=')) {
            location.href = ssoUrl;
            return;
        }
        
        // 否则构建完整的CAS登录URL，确保service参数正确
        const serviceParam = encodeURIComponent(casServiceUrl);
        const casLoginUrl = ssoUrl.includes('?') 
            ? `${ssoUrl}&service=${serviceParam}` 
            : `${ssoUrl}?service=${serviceParam}`;
        
        console.log("CAS登录URL:", casLoginUrl);
        location.href = casLoginUrl;
    }

    if (!ssoUrl && !wxUrl) return null

    return <div>
        <Separator className="my-4" text={t('login.otherMethods')}></Separator>
        <div className="flex justify-center items-center">
            {ssoUrl && <Button
                className="h-[48px] rounded-md bg-white hover:bg-gray-50/20"
                onClick={handleCASLogin}
            >
                <img src="/a1-logo-blue.png" alt="CAS" className="h-6" />
            </Button>}
            {wxUrl && <Button
                variant="outline"
                className="h-[48px] px-4"
                onClick={() => location.href = wxUrl}
            >
                <Wxpro className="mr-2" />
                微信登录
            </Button>}
        </div>
    </div>
};
