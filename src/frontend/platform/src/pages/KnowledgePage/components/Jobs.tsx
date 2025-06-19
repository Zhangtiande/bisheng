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
import { Filter, LucideBell, RotateCw } from "lucide-react";
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
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/bs-ui/dialog";
import { Input, Textarea } from "../../../components/bs-ui/input";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import {
    RadioGroup, RadioGroupItem
} from "@/components/bs-ui/radio";
import { Label } from "@/components/bs-ui/label";
import { Checkbox } from "@/components/bs-ui/checkBox";

// 假设有一个 API: fetchJobs
async function fetchJobs() {
    // TODO: 替换为实际 API 调用
    // 示例返回
    return [
        {
            id: 1,
            kb_id: "kb_001",
            kb_name: "知识库A",
            schedule: "0 0 * * *",
            created_at: "2025-06-01T12:00:00"
        },
        {
            id: 2,
            kb_id: "kb_002",
            kb_name: "知识库B",
            schedule: "0 12 * * 1",
            created_at: "2025-06-02T13:00:00"
        },
        {
            id: 3,
            kb_id: "kb_003",
            kb_name: "知识库C",
            schedule: "30 8 * * *",
            created_at: "2025-06-03T14:00:00"
        }
    ];
}

// 假设有一个知识库列表
const KB_LIST = [
    { id: "kb_001", name: "知识库A" },
    { id: "kb_002", name: "知识库B" },
    { id: "kb_003", name: "知识库C" }
];

// 新增：创建定时任务弹窗
function CreateJobModal({ open, setOpen, onCreate }) {
    const [form, setForm] = useState({
        kb_id: "",
        kb_name: "",
        model: "",
        schedule: ""
    });
    const [error, setError] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [periodType, setPeriodType] = useState("day"); // "day" | "week" | "month"
    const [weekDays, setWeekDays] = useState(["1"]); // 多选，字符串数组
    const [monthDays, setMonthDays] = useState(["1"]); // 多选，字符串数组
    const [time, setTime] = useState("00:00"); // HH:mm
    const { toast } = useToast();

    // 生成 cron 表达式
    useEffect(() => {
        let cron = "";
        const [hh, mm] = time.split(":");
        if (periodType === "day") {
            cron = `${mm || "0"} ${hh || "0"} * * *`;
        } else if (periodType === "week") {
            cron = `${mm || "0"} ${hh || "0"} * * ${weekDays.join(",")}`;
        } else if (periodType === "month") {
            cron = `${mm || "0"} ${hh || "0"} ${monthDays.join(",")} * *`;
        }
        setForm(f => ({ ...f, schedule: cron }));
    }, [periodType, weekDays, monthDays, time]);

    const handleChange = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
    };

    // 多选处理
    const handleMultiSelect = (value, arr, setArr) => {
        if (arr.includes(value)) {
            setArr(arr.filter(v => v !== value));
        } else {
            setArr([...arr, value]);
        }
    };

    // 选择知识库时自动填充id和name
    const handleKbSelect = (val) => {
        const kb = KB_LIST.find(k => k.id === val);
        setForm(f => ({
            ...f,
            kb_id: kb?.id || "",
            kb_name: kb?.name || ""
        }));
    };

    const handleCreate = async () => {
        const err = {};
        if (!form.kb_id) err.kb_id = "请选择知识库";
        if (!form.model) err.model = "请输入模型";
        if (!form.schedule) err.schedule = "请选择定时规则";
        setError(err);
        if (Object.keys(err).length) {
            toast({ variant: "error", description: Object.values(err).join("；") });
            return;
        }
        setIsSubmitting(true);
        // TODO: 调用后端API创建任务
        await new Promise(r => setTimeout(r, 500)); // mock
        setIsSubmitting(false);
        setOpen(false);
        onCreate && onCreate({
            ...form,
            id: Date.now(),
            created_at: new Date().toISOString()
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>创建定时任务</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                    <div>
                        <label htmlFor="dataSetName" className="bisheng-label">
                            <span className="text-red-500">*</span>知识库
                        </label>
                        <Select value={form.kb_id} onValueChange={handleKbSelect}>
                            <SelectTrigger className={`mt-2 col-span-3 ${error.kb_id ? "border-red-400" : ""}`}>
                                {form.kb_name || "请选择知识库"}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {KB_LIST.map(kb => (
                                        <SelectItem key={kb.id} value={kb.id}>{kb.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="bisheng-label">执行周期</label>
                        {/* 替换为RadioGroup */}
                        <RadioGroup
                            value={periodType}
                            className="flex gap-4 mt-2"
                            onValueChange={setPeriodType}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="day" id="period-day" />
                                <Label htmlFor="period-day" className="ml-1">每天</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="week" id="period-week" />
                                <Label htmlFor="period-week" className="ml-1">每周</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="month" id="period-month" />
                                <Label htmlFor="period-month" className="ml-1">每月</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {periodType === "week" && (
                        <div>
                            <label className="bisheng-label">星期（多选）</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {[
                                    { label: "一", value: "1" },
                                    { label: "二", value: "2" },
                                    { label: "三", value: "3" },
                                    { label: "四", value: "4" },
                                    { label: "五", value: "5" },
                                    { label: "六", value: "6" },
                                    { label: "日", value: "0" }
                                ].map(opt => (
                                    <Label key={opt.value} className={`flex w-20 items-center gap-1 px-2 py-1 border rounded cursor-pointer select-none${weekDays.includes(opt.value) ? " bg-indigo-100" : ""}`}>
                                        <Checkbox
                                            checked={weekDays.includes(opt.value)}
                                            onCheckedChange={() => handleMultiSelect(opt.value, weekDays, setWeekDays)}
                                        />
                                        星期{opt.label}
                                    </Label>
                                ))}
                            </div>
                        </div>
                    )}
                    {periodType === "month" && (
                        <div>
                            <label className="bisheng-label">日期（多选）</label>
                            <div className="flex flex-wrap gap-2 mt-1 max-h-24 overflow-y-auto">
                                {Array.from({ length: 31 }, (_, i) => {
                                    const val = String(i + 1);
                                    return (
                                        <Label key={val} className={`flex w-20 items-center gap-1 px-2 py-1 border rounded cursor-pointer select-none${monthDays.includes(val) ? " bg-indigo-100" : ""}`}>
                                            <Checkbox
                                                checked={monthDays.includes(val)}
                                                onCheckedChange={() => handleMultiSelect(val, monthDays, setMonthDays)}
                                            />
                                            {val}号
                                        </Label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="">
                        <label className="bisheng-label">执行时间</label>
                        <div className="relative flex items-center">
                            <Input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="mt-2"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            />
                        </div>
                    </div>
                    <div className="">
                        <label className="bisheng-label">Cron 规则表达式</label>
                        <Input value={form.schedule} readOnly className={`mt-2 col-span-3 ${error.schedule ? "border-red-400" : ""}`} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose>
                        <Button variant="outline" className="px-11">取消</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        className="px-11 flex"
                        onClick={handleCreate}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <LoadingIcon className="mr-1" />}
                        创建
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Tasks() {
    const [datalist, setDatalist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    // 拉取数据
    useEffect(() => {
        setLoading(true);
        fetchJobs().then(data => {
            setTotal(data.length);
            setDatalist(
                data
                    .filter(el =>
                        !searchKeyword ||
                        el.kb_id.includes(searchKeyword) ||
                        el.kb_name.includes(searchKeyword) ||
                        el.model.includes(searchKeyword)
                    )
                    .slice((page - 1) * pageSize, page * pageSize)
            );
        }).finally(() => setLoading(false));
    }, [searchKeyword, page, pageSize]);

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

    // 新增：创建后刷新
    const handleCreateJob = (job) => {
        setDatalist(list => [job, ...list]);
        setTotal(t => t + 1);
    };

    return (
        <div className="relative h-[calc(100vh-128px)]">
            {loading && <div className="absolute w-full h-full top-0 left-0 flex justify-center items-center z-10 bg-[rgba(255,255,255,0.6)] dark:bg-blur-shared">
                <LoadingIcon />
            </div>}
            <div className="flex justify-end gap-4 items-center absolute right-0 top-[-45px]">
                <SearchInput placeholder="搜索定时任务" onChange={(e) => setSearchKeyword(e.target.value)} />
                <Button className="px-8 text-[#FFFFFF]" onClick={() => setCreateOpen(true)}>创建</Button>
            </div>
            <CreateJobModal open={createOpen} setOpen={setCreateOpen} onCreate={handleCreateJob} />
            <div className="h-[calc(100vh-180px)] overflow-y-auto pb-20">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[120px]">知识库ID</TableHead>
                            <TableHead className="min-w-[160px]">知识库名称</TableHead>
                            <TableHead className="min-w-[160px]">模型</TableHead>
                            <TableHead className="min-w-[160px]">定时规则</TableHead>
                            <TableHead className="min-w-[160px]">创建时间</TableHead>
                            <TableHead className="text-right pr-6">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datalist.map(el => (
                            <TableRow key={el.id}>
                                <TableCell className="font-medium">{el.kb_id}</TableCell>
                                <TableCell className="font-medium">{el.kb_name}</TableCell>
                                <TableCell className="font-medium">{el.model}</TableCell>
                                <TableCell className="font-medium">{el.schedule}</TableCell>
                                <TableCell>{el.created_at?.replace('T', ' ')}</TableCell>
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
                <p className="desc">定时任务列表</p>
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
