import { Button } from "../../../components/bs-ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../../components/bs-ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/bs-ui/tooltip";
import { Filter, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "../../../components/bs-ui/input";
import AutoPagination from "../../../components/bs-ui/pagination/autoPagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "../../../components/bs-ui/select";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { LoadingIcon } from "@/components/bs-icons/loading";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../../../components/bs-ui/tabs";

// 新 mock 数据
const mockSyncingTasks = [
    {
        id: 1,
        kb_id: "kb_001",
        kb_name: "知识库A",
        model: "embeddingModel",
        created_at: "2025-06-01T12:00:00",
        status: 1 // 1:同步中
    }
];

const mockFinishedTasks = [
    {
        id: 2,
        kb_id: "kb_002",
        kb_name: "知识库B",
        model: "embeddingModel",
        created_at: "2025-06-02T13:00:00",
        status: 2 // 2:已完成
    },
    {
        id: 3,
        kb_id: "kb_003",
        kb_name: "知识库C",
        model: "embeddingModel",
        created_at: "2025-06-03T14:00:00",
        status: 2
    }
];

export default function Tasks() {
    const [datalist, setDatalist] = useState(mockSyncingTasks);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(mockSyncingTasks.length);
    const [filter, setFilter] = useState(999);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [tab, setTab] = useState<"syncing" | "finished">("syncing");

    // 轮询同步中任务
    const timerRef = useRef(null);
    useEffect(() => {
        if (datalist.some(el => el.status === 1)) {
            timerRef.current = setTimeout(() => {
                // reload();
            }, 5000);
            return () => clearTimeout(timerRef.current);
        }
    }, [datalist]);

    // Tab切换和筛选、搜索
    useEffect(() => {
        let source = tab === "syncing" ? mockSyncingTasks : mockFinishedTasks;
        let filtered = source;
        // 下拉筛选
        if (filter !== 999) {
            filtered = filtered.filter(el => el.status === filter);
        }
        if (searchKeyword) {
            // 支持按知识库ID、知识库名称、模型模糊搜索
            filtered = filtered.filter(
                el =>
                    el.kb_id.includes(searchKeyword) ||
                    el.kb_name.includes(searchKeyword) ||
                    el.model.includes(searchKeyword)
            );
        }
        setTotal(filtered.length);
        setDatalist(filtered.slice((page - 1) * pageSize, page * pageSize));
    }, [filter, searchKeyword, page, pageSize, tab]);

    const handleDelete = (id) => {
        bsConfirm({
            title: '提示',
            desc: '确认删除该同步任务？',
            onOk(next) {
                setDatalist(list => list.filter(item => item.id !== id));
                next();
            },
        });
    };

    const selectChange = (id) => {
        setFilter(Number(id));
        setPage(1);
    };

    // 重试同步
    const handleRetry = (task) => {
        setDatalist(list =>
            list.map(item =>
                item.id === task.id ? { ...item, status: 1, remark: "" } : item
            )
        );
    };

    // 状态映射
    const statusMap = [
        '', // 0 占位
        '同步中', // 1
        '已完成'  // 2
    ];

    return (
        <div className="relative h-[calc(100vh-128px)]">
            {loading && <div className="absolute w-full h-full top-0 left-0 flex justify-center items-center z-10 bg-[rgba(255,255,255,0.6)] dark:bg-blur-shared">
                <LoadingIcon />
            </div>}
            <Tabs value={tab} onValueChange={v => { setTab(v as any); setPage(1); }} className="left-[25%] absolute top-[-45px]">
                <TabsList >
                    <TabsTrigger value="syncing">正在同步</TabsTrigger>
                    <TabsTrigger value="finished">已完成</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex justify-end gap-4 items-center absolute right-0 top-[-45px]">
                <div>
                    <SearchInput placeholder="搜索知识库ID/名称/模型" onChange={(e) => setSearchKeyword(e.target.value)} />
                </div>
                <Button variant="outline" className="px-4">全部开始</Button>
                <Button variant="outline" className="px-4">全部暂停</Button>
            </div>
            <div className="h-[calc(100vh-180px)] overflow-y-auto pb-20">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[120px]">知识库ID</TableHead>
                            <TableHead className="min-w-[200px]">知识库名称</TableHead>
                            <TableHead className="min-w-[160px]">模型</TableHead>
                            <TableHead className="min-w-[160px]">创建时间</TableHead>
                            <TableHead className="flex items-center gap-4 min-w-[100px]">
                                状态
                                <Select onValueChange={selectChange}>
                                    <SelectTrigger className="border-none w-16">
                                        <Filter size={16} className={`cursor-pointer ${filter === 999 ? '' : 'text-gray-950'}`} />
                                    </SelectTrigger>
                                    <SelectContent className="w-fit">
                                        <SelectGroup>
                                            <SelectItem value={'999'}>全部</SelectItem>
                                            <SelectItem value={'1'}>同步中</SelectItem>
                                            <SelectItem value={'2'}>已完成</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </TableHead>
                            <TableHead className="text-right pr-6">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datalist.map(el => (
                            <TableRow key={el.id}>
                                <TableCell className="font-medium">{el.kb_id}</TableCell>
                                <TableCell className="font-medium">{el.kb_name}</TableCell>
                                <TableCell className="font-medium">{el.model}</TableCell>
                                <TableCell>{el.created_at?.replace('T', ' ')}</TableCell>
                                <TableCell>
                                    <span>
                                        {statusMap[el.status]}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="link" disabled={el.status !== 2} className="px-2 dark:disabled:opacity-80">查看</Button>
                                    <Button variant="link" onClick={() => handleDelete(el.id)} className="text-red-500 px-2">删除</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="bisheng-table-footer px-6">
                <p className="desc">同步任务列表</p>
                <div>
                    <AutoPagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onChange={(newPage) => setPage(newPage)}
                    />
                </div>
            </div>
        </div>
    );
}
