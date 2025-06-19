import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/bs-ui/button";
import { Input, PasswordInput, SearchInput } from "../../components/bs-ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/bs-ui/table";

import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "../../components/bs-ui/input";
import { userContext } from "../../contexts/userContext";
import { copyLibDatabase, createFileLib, deleteFileLib, readFileLibDatabase } from "../../controllers/API";
import { captureAndAlertRequestErrorHoc } from "../../controllers/request";
// import PaginationComponent from "../../components/PaginationComponent";
import { LoadIcon, LoadingIcon } from "@/components/bs-icons/loading";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/bs-ui/dialog";
import Cascader from "@/components/bs-ui/select/cascader";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { getKnowledgeModelConfig, getModelListApi } from "@/controllers/API/finetune";
import AutoPagination from "../../components/bs-ui/pagination/autoPagination";
import { useTable } from "../../util/hook";
import { 
    Select, SelectContent, SelectGroup, SelectItem, SelectTrigger 
} from "../../components/bs-ui/select";

function CreateModal({ datalist, open, setOpen, onLoadEnd }) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const nameRef = useRef(null)
    const descRef = useRef(null)
    const [modal, setModal] = useState(null)
    const [options, setOptions] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    // 新增：知识库类型和相关字段
    const [libType, setLibType] = useState("default")
    const [shareFields, setShareFields] = useState({
        host: "",
        port: "",
        rootNodeRef: "",
        username: "",
        password: "",
    })

    // Fetch model data
    useEffect(() => {
        Promise.all([getKnowledgeModelConfig(), getModelListApi()]).then(([config, data]) => {
            const { embedding_model_id } = config
            let embeddings = []
            let models = {}
            let _model = []
            data.forEach(server => {
                const serverItem = { value: server.id, label: server.name, children: [] }
                serverItem.children = server.models.reduce((res, model) => {
                    if (model.model_type !== 'embedding' || !model.online) return res
                    const modelItem = { value: model.id, label: model.model_name }
                    models[model.id] = model.model_name
                    // 找到默认值
                    if (model.id === embedding_model_id) {
                        _model = [serverItem, modelItem]
                    }
                    return [...res, modelItem]
                }, [])
                if (serverItem.children.length) embeddings.push(serverItem)
            });
            setOptions(embeddings)
            setModal(_model)
            onLoadEnd(models)
        }).catch(error => {  // 添加错误处理
            toast({
                variant: "error",
                description: '加载模型出错'
            })
        })
    }, [])

    const { toast } = useToast()
    const [error, setError] = useState({ name: false, desc: false, host: false, port: false, rootNodeRef: false, username: false, password: false })

    const handleCreate = async () => {
        const name = nameRef.current.value
        const desc = descRef.current.value
        const errorlist = []

        // 新增：重置 share 字段错误
        let shareFieldErrors = {
            host: false,
            port: false,
            rootNodeRef: false,
            username: false,
            password: false,
        }

        if (!name) errorlist.push(t('lib.enterLibraryName'))
        if (name.length > 30) errorlist.push(t('lib.libraryNameLimit'))
        if (!modal) errorlist.push(t('lib.selectModel'))
        if (datalist.find(data => data.name === name)) errorlist.push(t('lib.nameExists'))

        const nameErrors = errorlist.length
        if (desc.length > 200) errorlist.push(t('lib.descriptionLimit'))

        // 新增：校验 A1-share2.0/A1-share3.0 字段
        if (libType === "A1-share2.0" || libType === "A1-share3.0") {
            // host 校验：非空且为合法域名或IP
            if (!shareFields.host) {
                errorlist.push("服务器地址不能为空")
                shareFieldErrors.host = true
            } else if (!/^([a-zA-Z0-9.-]+|\d{1,3}(\.\d{1,3}){3})$/.test(shareFields.host)) {
                errorlist.push("服务器地址格式不正确")
                shareFieldErrors.host = true
            }
            // port 校验：非空且为数字且在1-65535
            if (!shareFields.port) {
                errorlist.push("端口不能为空")
                shareFieldErrors.port = true
            } else if (!/^\d+$/.test(shareFields.port) || +shareFields.port < 1 || +shareFields.port > 65535) {
                errorlist.push("端口格式不正确，应为1-65535的数字")
                shareFieldErrors.port = true
            }
            // rootNodeRef 校验：非空且为小写带-的uuid
            if (!shareFields.rootNodeRef) {
                errorlist.push("站点ID不能为空")
                shareFieldErrors.rootNodeRef = true
            } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(shareFields.rootNodeRef)) {
                errorlist.push("站点ID格式不正确，必须为小写带-的UUID，例如 76ef8c95-xxxx-xxxx-xxxx-8ab1eabe574d")
                shareFieldErrors.rootNodeRef = true
            }
            // username 校验：非空
            if (!shareFields.username) {
                errorlist.push("用户名不能为空")
                shareFieldErrors.username = true
            }
            // password 校验：非空
            if (!shareFields.password) {
                errorlist.push("密码不能为空")
                shareFieldErrors.password = true
            }
        }

        setError({
            name: !!nameErrors,
            desc: errorlist.length > nameErrors,
            ...shareFieldErrors
        })
        if (errorlist.length) return handleError(errorlist)

        setIsSubmitting(true)
        // 新增 storage_type 和 storage_config 字段
        let storage_type = 0
        let storage_config = undefined
        if (libType === "A1-share2.0") {
            storage_type = 1
        } else if (libType === "A1-share3.0") {
            storage_type = 2
        }
        if (libType === "A1-share2.0" || libType === "A1-share3.0") {
            storage_config = {
                host: shareFields.host,
                port: shareFields.port,
                rootNodeRef: shareFields.rootNodeRef,
                password: shareFields.password,
                username: shareFields.username,
            }
        }

        await captureAndAlertRequestErrorHoc(createFileLib({
            name,
            description: desc,
            model: modal[1].value,
            type: 0,
            libType,
            storage_type,
            ...(storage_config ? { storage_config } : {}),
        }).then(res => {
            // @ts-ignore
            window.libname = [name, desc]
            navigate("/filelib/" + res.id);
            setOpen(false)
            setIsSubmitting(false)
        }))
        setIsSubmitting(false)
    }

    const handleError = (list) => {
        toast({
            variant: 'error',
            description: list
        });
    }

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>{t('lib.createLibrary')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
                <div className="">
                    <label htmlFor="name" className="bisheng-label">{t('lib.libraryName')}</label>
                    <Input name="name" ref={nameRef} placeholder={t('lib.libraryName')} className={`col-span-3 ${error.name && 'border-red-400'}`} />
                </div>
                {/* 新增：知识库类型选择*/}
                <div>
                    <label className="bisheng-label">知识库类型</label>
                    <Select value={libType} onValueChange={setLibType}>
                        <SelectTrigger className="col-span-3">
                            {{
                                "default": "default",
                                "A1-share2.0": "A1-share2.0",
                                "A1-share3.0": "A1-share3.0"
                            }[libType] || "请选择类型"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="default">default</SelectItem>
                                <SelectItem value="A1-share2.0">A1-share2.0</SelectItem>
                                <SelectItem value="A1-share3.0">A1-share3.0</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                {/* 新增：A1-share2.0/A1-share3.0字段 */}
                {(libType === "A1-share2.0" || libType === "A1-share3.0") && (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <div className="flex-[2]">
                                <label className="bisheng-label">服务器</label>
                                <Input
                                    value={shareFields.host}
                                    onChange={e => setShareFields(f => ({ ...f, host: e.target.value }))}
                                    placeholder="服务器地址"
                                    className={`col-span-3 ${error.host && 'border-red-400'}`}
                                />
                            </div>
                            <div className="flex-[1]">
                                <label className="bisheng-label">端口</label>
                                <Input
                                    value={shareFields.port}
                                    onChange={e => setShareFields(f => ({ ...f, port: e.target.value }))}
                                    placeholder="80"
                                    className={`col-span-3 ${error.port && 'border-red-400'}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="bisheng-label">站点ID</label>
                            <Input
                                value={shareFields.rootNodeRef}
                                onChange={e => setShareFields(f => ({ ...f, rootNodeRef: e.target.value }))}
                                placeholder="站点ID"
                                className={`col-span-3 ${error.rootNodeRef && 'border-red-400'}`}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="bisheng-label">用户名</label>
                                <Input
                                    value={shareFields.username}
                                    onChange={e => setShareFields(f => ({ ...f, username: e.target.value }))}
                                    placeholder="用户名"
                                    className={`col-span-3 ${error.username && 'border-red-400'}`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="bisheng-label">密码</label>
                                <PasswordInput
                                    value={shareFields.password}
                                    onChange={e => setShareFields(f => ({ ...f, password: e.target.value }))}
                                    placeholder="密码"
                                    className={`col-span-3 ${error.password && 'border-red-400'}`}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="">
                    <label htmlFor="name" className="bisheng-label">{t('lib.description')}</label>
                    <Textarea id="desc" ref={descRef} placeholder={t('lib.description')} className={`col-span-3 ${error.desc && 'border-red-400'}`} />
                </div>
                <div className="">
                    <label htmlFor="roleAndTasks" className="bisheng-label">{t('lib.model')}</label>
                    {
                        modal && <Cascader
                            defaultValue={modal}
                            placholder="请在模型管理中配置 embedding 模型"
                            options={options}
                            onChange={(a, val) => setModal(val)}
                        />
                    }
                </div>
            </div>
            <DialogFooter>
                <DialogClose>
                    <Button variant="outline" className="px-11">{t('cancel')}</Button>
                </DialogClose>
                <Button
                    type="submit"
                    className="px-11 flex"
                    onClick={handleCreate}
                    disabled={isSubmitting}
                >
                    {isSubmitting && <LoadIcon className="mr-1" />}
                    {t('create')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}

const doing = {} // 记录copy中的知识库
export default function KnowledgeFile() {
    const [open, setOpen] = useState(false);
    const { user } = useContext(userContext);
    const [modelNameMap, setModelNameMap] = useState({})
    const { message } = useToast()

    const { page, pageSize, data: datalist, total, loading, setPage, search, reload } = useTable({ cancelLoadingWhenReload: true }, (param) =>
        readFileLibDatabase({ ...param, name: param.keyword })
    )

    // 复制中开启轮询
    useEffect(() => {
        const todos = datalist.reduce((prev, curr) => {
            if (curr.state === 1) {
                prev.push({ id: curr.id, name: curr.name })
            } else {
                doing[curr.id] = true
            }
            return prev
        }, [])

        todos.map(todo => {
            if (doing[todo.id]) {
                message({
                    variant: 'success',
                    description: `${todo.name} 复制完成`
                })
                delete doing[todo.id]
            }
        })

        todos.length && setTimeout(() => {
            reload()
        }, 5000);
    }, [datalist])

    const handleDelete = (id) => {
        bsConfirm({
            title: t('prompt'),
            desc: t('lib.confirmDeleteLibrary'),
            onOk(next) {
                captureAndAlertRequestErrorHoc(deleteFileLib(id).then(res => {
                    reload();
                }));
                next()
            },
        })
    }

    // 进详情页前缓存 page, 临时方案
    const handleCachePage = () => {
        window.LibPage = { page, type: 'file' }
    }
    useEffect(() => {
        const _page = window.LibPage
        if (_page) {
            setPage(_page.page);
            delete window.LibPage
        } else {
            setPage(1);
        }
    }, [])


    const { t, i18n } = useTranslation();
    useEffect(() => {
        i18n.loadNamespaces('knowledge');
    }, [i18n]);

    // copy
    const handleCopy = (elem) => {
        captureAndAlertRequestErrorHoc(copyLibDatabase(elem.id))

        reload()
    }

    return (
        <div className="relative">
            {loading && <div className="absolute w-full h-full top-0 left-0 flex justify-center items-center z-10 bg-[rgba(255,255,255,0.6)] dark:bg-blur-shared">
                <LoadingIcon />
            </div>}
            <div className="h-[calc(100vh-128px)] overflow-y-auto pb-20">
                <div className="flex justify-end gap-4 items-center absolute right-0 top-[-44px]">
                    <SearchInput placeholder="知识库或文件名称" onChange={(e) => search(e.target.value)} />
                    <Link to='/filelib/sync'><Button variant="outline" className="px-8">同步</Button></Link>
                    <Link to='/filelib/timer'><Button variant="outline" className="px-8">定时</Button></Link>
                    <Button className="px-8 text-[#FFFFFF]" onClick={() => setOpen(true)}>{t('create')}</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('lib.knowledgeBaseId')}</TableHead>
                            <TableHead className="w-[200px]">{t('lib.libraryName')}</TableHead>
                            <TableHead>{t('lib.model')}</TableHead>
                            <TableHead>{t('createTime')}</TableHead>
                            <TableHead>{t('updateTime')}</TableHead>
                            <TableHead>{t('lib.createUser')}</TableHead>
                            <TableHead className="text-right">{t('operations')}</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {datalist.map((el: any) => (
                            <TableRow key={el.id}>
                                <TableCell>{el.id}</TableCell>
                                <TableCell className="font-medium max-w-[200px]">
                                    <div className=" truncate-multiline">{el.name}</div>
                                </TableCell>
                                <TableCell>{modelNameMap[el.model] || '--'}</TableCell>
                                <TableCell>{el.create_time.replace('T', ' ')}</TableCell>
                                <TableCell>{el.update_time.replace('T', ' ')}</TableCell>
                                <TableCell className="max-w-[300px] break-all">
                                    <div className=" truncate-multiline">{el.user_name || '--'}</div>
                                </TableCell>
                                <TableCell className="text-right" onClick={() => {
                                    // @ts-ignore
                                    window.libname = [el.name, el.description];
                                }}>
                                    <Link to={`/filelib/${el.id}`} className="no-underline hover:underline text-primary" onClick={handleCachePage}>{t('lib.details')}</Link>
                                    {(el.copiable || user.role === 'admin') && (el.state === 1
                                        ? <Button variant="link" className="px-0 pl-2" onClick={() => handleCopy(el)}>{t('lib.copy')}</Button>
                                        : <Button variant="link" className="px-0 pl-2" disabled>{t('lib.copying')}</Button>)}
                                    {el.copiable ?
                                        <Button variant="link" onClick={() => handleDelete(el.id)} className="text-red-500 px-0 pl-2">{t('delete')}</Button> :
                                        <Button variant="link" className=" text-gray-400 px-0 pl-2">{t('delete')}</Button>
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="bisheng-table-footer px-6 bg-background-login">
                <p className="desc">{t('lib.libraryCollection')}</p>
                <div>
                    <AutoPagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onChange={(newPage) => setPage(newPage)}
                    />
                </div>
            </div>
            <CreateModal datalist={datalist} open={open} setOpen={setOpen} onLoadEnd={setModelNameMap}></CreateModal>
        </div>
    );
}