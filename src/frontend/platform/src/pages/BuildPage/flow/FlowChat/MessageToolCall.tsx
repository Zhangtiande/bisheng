import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/bs-ui/accordion";
import { Badge } from "@/components/bs-ui/badge";
import { WorkflowMessage } from "@/types/flow";

export default function MessageToolCall({ data, index }: { data: WorkflowMessage; index: number }) {
    const { message } = data as any;
    const status = data.end ? (message.error ? "Error" : "Success") : "Running";

    return (
        <div className="py-1">
            <Accordion type="single" collapsible>
                <AccordionItem value={message.run_id} className="border rounded-md">
                    <AccordionTrigger className="px-4 py-2 flex items-center gap-2 text-sm">
                        <span className="font-bold">{index + 1}. {message.name}</span>
                        <Badge variant={status === 'Error' ? 'destructive' : status === 'Success' ? 'secondary' : 'outline'}>{status}</Badge>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-2 text-sm space-y-2">
                        {message.input && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Request</div>
                                <pre className="bg-muted p-2 rounded whitespace-pre-wrap overflow-x-auto">{message.input}</pre>
                            </div>
                        )}
                        {message.output && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Response</div>
                                <pre className="bg-muted p-2 rounded whitespace-pre-wrap overflow-x-auto">{message.output}</pre>
                            </div>
                        )}
                        {message.error && (
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Error</div>
                                <pre className="bg-muted p-2 rounded whitespace-pre-wrap overflow-x-auto text-red-500">{message.error}</pre>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

