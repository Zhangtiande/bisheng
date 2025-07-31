import { getFlowApi } from "@/controllers/API/flow";
import { cloneDeep } from "lodash-es";
import { useEffect, useMemo, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/bs-ui/button";
import { userContext } from "@/contexts/userContext";
import { lockWorkflowApi, unlockWorkflowApi } from "@/controllers/API/workflow";
import { useTranslation } from "react-i18next";
import Panne from "./Panne";
import useFlowStore from "./flowStore";
import { flowVersionCompatible } from "@/util/flowCompatible";


export default function FlowPage() {
    // const { flow, setFlow } = useContext(TabsContext);
    const { id } = useParams();

    // useEffect(() => {
    //     if (id && flow?.id !== id) {
    //         // 切换技能重新加载flow数据
    //         getFlowApi(id).then(_flow => setFlow('flow_init', _flow))
    //     }
    // }, [])

    const { flow, setFlow, clearRunCache, clearNotifications } = useFlowStore()
    const { t } = useTranslation('flow')
    const { user } = useContext(userContext)
    const [editable, setEditable] = useState(false)
    const handleEdit = async () => {
        const res = await lockWorkflowApi(id)
        if (res) setEditable(true)
    }

    useEffect(() => {
        getFlowApi(id).then(f => {
            clearRunCache();

            setEditable(!f.locked_by || f.locked_by === user?.user_id)

            if (f.data) {
                const { data, ..._flow } = f
                return setFlow({
                    ..._flow,
                    nodes: data.nodes,
                    edges: data.edges,
                    viewport: data.viewport
                })
            }
            // default
            setFlow({
                ...f,
                nodes: [],
                edges: [],
                viewport: {
                    x: 0,
                    y: 0,
                    zoom: 1
                },
                version_list: []
            });
        })
        return () => {
            setFlow(null);
            clearRunCache();
            clearNotifications();
            if (editable) {
                unlockWorkflowApi(id);
            }
        }
    }, [])

    const [copyFlow, preFlow] = useMemo(() => {
        if (flow?.id === id) {
            // const copyFlow = cloneDeep(flow)
            // 版本兼容
            const newFlow = flowVersionCompatible(flow)
            return [newFlow, JSON.stringify(newFlow || null)] as const
        }
        return []
    }, [flow, id])

    return (
        <div className="flow-page-positioning relative">
            {!editable && <Button className="absolute right-4 top-4 z-10" size="sm" onClick={handleEdit}>{t('flow.edit')}</Button>}
            {copyFlow && <Panne flow={copyFlow} preFlow={preFlow} />}
            {!editable && <div className="absolute inset-0 bg-gray-50/70 pointer-events-none"></div>}
        </div>
    );
}

