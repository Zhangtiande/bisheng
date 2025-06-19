
import { ArrowLeft, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../../components/bs-ui/button";
import ShadTooltip from "../../../components/ShadTooltipComponent";

export default function Header() {
    const { t } = useTranslation()

    return <div className="flex items-start h-12">
        <ShadTooltip content={t('back')} side="top">
            <Link to='/filelib'>
                <button className="extra-side-bar-buttons w-[36px]">
                    <ArrowLeft className="side-bar-button-size" />
                </button>
            </Link>
        </ShadTooltip>
    </div>
};
