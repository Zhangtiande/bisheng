import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/bs-ui/tabs";
import { useState } from "react";
import Jobs from "./components/Jobs";
import TaskHeader from "./components/TaskHeader";
import { useTranslation } from "react-i18next";

export default function FilesPage() {
    const { t } = useTranslation('knowledge')

    return <div className="size-full px-2 py-4 relative bg-background-login">
        <div className="flex justify-between w-1/2">
            <TaskHeader />
        </div>
        <Jobs />
    </div>
};