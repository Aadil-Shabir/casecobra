"use client";

import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { Image, Loader2, MousePointerSquareDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Dropzone, { FileRejection } from "react-dropzone";

const Page = () => {
    const { toast } = useToast();
    const [dragOver, setDragOver] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: ([data]) => {
            const configId = data.serverData.configId;
            startTransition(() => {
                router.push(`/configure/design?id=${configId}`);
            });
        },
        onUploadProgress(p) {
            setUploadProgress(p);
        },
    });

    const onDropRejected = (rejectedFiles: FileRejection[]) => {
        const [file] = rejectedFiles;
        setDragOver(false);

        toast({
            title: `${file.file.type} type is not supported.`,
            description: "Please choose a PNG, JPG, or JPEG image instead",
            variant: "destructive",
        });
    };

    const onDropAccepted = (acceptedFiles: File[]) => {
        startUpload(acceptedFiles, { configId: undefined });

        setDragOver(false);
    };

    return (
        <div
            className={cn(
                "relative h-full flex-1 my-16 w-full rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/5 lg:rounded-2xl flex justify-center flex-col items-center",
                { "ring-blue-900/25 bg-blue-900/10": dragOver }
            )}
        >
            <div className="relative flex flex-1 flex-col items-center justify-center w-full">
                <Dropzone
                    onDropRejected={onDropRejected}
                    onDropAccepted={onDropAccepted}
                    accept={{ "image/png": [".png"], "image/jpeg": [".jpeg"], "image/jpg": [".jpg"] }}
                    onDragEnter={() => setDragOver(true)}
                    onDragLeave={() => setDragOver(false)}
                >
                    {({ getRootProps, getInputProps }) => (
                        <div
                            className="h-full w-full flex-1 flex flex-col items-center
                     justify-center"
                            {...getRootProps()}
                        >
                            <input {...getInputProps()} />
                            {dragOver ? (
                                <MousePointerSquareDashed className="size-6 text-zinc-500 mb-2" />
                            ) : isUploading || isPending ? (
                                <Loader2 className="size-6 animate-spin text-zinc-500 mb-2" />
                            ) : (
                                <Image className="size-6 text-zinc-500 mb-2" />
                            )}
                            <div className="flex flex-col justify-center mb-2 text-sm text-zinc-700">
                                {isUploading ? (
                                    <div className="flex flex-col items-center">
                                        <p>Uploading...</p>
                                        <Progress className="mt-2 w-40 h-2 bg-gray-300" value={uploadProgress} />
                                    </div>
                                ) : isPending ? (
                                    <div className="flex flex-col items-center">
                                        <p>Redirecting, please wait...</p>
                                    </div>
                                ) : dragOver ? (
                                    <p>
                                        <span className="font-semibold">Drop file</span> to upload
                                    </p>
                                ) : (
                                    <p>
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                )}
                            </div>
                            {isPending ? null : <p className="text-xs text-zinc-500">PNG, JPG, JPEG</p>}
                        </div>
                    )}
                </Dropzone>
            </div>
        </div>
    );
};

export default Page;
