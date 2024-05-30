"use client";

import HandleComponent from "@/components/HandleComponent";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPrice } from "@/lib/utils";
import NextImage from "next/image";
import { Rnd } from "react-rnd";
import { RadioGroup, Radio, Label as RadioLabel, Description } from "@headlessui/react";
import { useRef, useState } from "react";
import { COLORS, FINISHES, MATERIALS, MODELS } from "@/validators/option-validator";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { BASE_PRICE } from "@/config/products";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { SaveConfigArgs, saveConfig as _saveConfig } from "./actions";
import { useRouter } from "next/navigation";

interface DesignConfigurator {
    configId: string;
    imageURL: string;
    imageDimensions: { width: number; height: number };
}

const DesignConfigurator = ({ configId, imageURL, imageDimensions }: DesignConfigurator) => {
    const { toast } = useToast();
    const router = useRouter();

    const { mutate: saveConfig } = useMutation({
        mutationKey: ["save-config"],
        mutationFn: async (args: SaveConfigArgs) => {
            await Promise.all([saveConfiguration(), _saveConfig(args)]);
        },
        onError: () => {
            toast({
                title: "something went wrong",
                description: "There was an error on our end. Please try again",
                variant: "destructive",
            });
        },
        onSuccess: () => {
            router.push(`/configure/preview?id=${configId}`);
        },
    });

    const [options, setOptions] = useState<{
        color: (typeof COLORS)[number];
        model: (typeof MODELS.options)[number];
        material: (typeof MATERIALS.options)[number];
        finish: (typeof FINISHES.options)[number];
    }>({
        color: COLORS[0],
        model: MODELS.options[0],
        material: MATERIALS.options[0],
        finish: FINISHES.options[0],
    });

    const [renderedDimensions, setRenderedDimensions] = useState({
        width: imageDimensions.width / 4,
        height: imageDimensions.height / 4,
    });

    const [renderedPosition, setRenderedPosition] = useState({
        x: 150,
        y: 205,
    });

    const phonecaseRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { startUpload } = useUploadThing("imageUploader");

    async function saveConfiguration() {
        try {
            const { left: caseLeft, top: caseTop, width, height } = phonecaseRef.current!.getBoundingClientRect();
            const { left: containerLeft, top: containerTop } = containerRef.current!.getBoundingClientRect();

            const leftOffset = caseLeft - containerLeft;
            const topOffset = caseTop - containerTop;

            const actualX = renderedPosition.x - leftOffset;
            const actualY = renderedPosition.y - topOffset;

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            const userImage = new Image();
            userImage.crossOrigin = "anonymous";
            userImage.src = imageURL;
            await new Promise((res) => (userImage.onload = res));

            ctx?.drawImage(userImage, actualX, actualY, renderedDimensions.width, renderedDimensions.height);

            const base64 = canvas.toDataURL();
            const base64Data = base64.split(",")[1];

            const blob = base64ToBlob(base64Data, "image/png");
            const file = new File([blob], "filename.png", { type: "image/png" });

            await startUpload([file], { configId });
        } catch (error) {
            console.log(error);
            toast({
                title: "Something went wrong",
                description: "There was a problem saving your config, please try again.",
                variant: "destructive",
            });
        }
    }

    function base64ToBlob(base64: string, mimeType: string) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    return (
        <div className="relative mt-20 grid grid-cols-1 lg:grid-cols-3 mb-20 pb-20">
            <div
                ref={containerRef}
                className="relative h-[37.5rem] overflow-hidden col-span-2 w-full max-w-4xl flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                <div className="relative w-60 bg-opacity-50 pointer-events-none aspect-[896/1831]">
                    <AspectRatio
                        ref={phonecaseRef}
                        ratio={896 / 1831}
                        className="pointer-events-none relative z-50 aspect-[896/1831] w-full"
                    >
                        <NextImage
                            src="/phone-template.png"
                            alt="phone image"
                            className="pointer-events-none z-50 select-none"
                            fill
                        />
                    </AspectRatio>
                    <div className="absolute z-40 inset-0 left-[3px] top-px right-[3px] bottom-px rounded-[32px] shadow-[0_0_0_99999px_rgba(229,231,235,0.6)]" />
                    <div
                        className={cn(
                            "absolute inset-0 left-[3px] right-[3px] top-px bottom-px rounded-[32px]",
                            `bg-${options.color.tw}`
                        )}
                    />
                </div>
                <Rnd
                    default={{ x: 150, y: 205, height: imageDimensions.height / 4, width: imageDimensions.width / 4 }}
                    lockAspectRatio
                    onResize={(_, __, ref, ___, { x, y }) => {
                        setRenderedDimensions({
                            height: parseInt(ref.style.height.slice(0, -2)),
                            width: parseInt(ref.style.width.slice(0, -2)),
                        });
                        setRenderedPosition({ x, y });
                    }}
                    onDragStop={(_, data) => {
                        const { x, y } = data;
                        setRenderedPosition({ x, y });
                    }}
                    resizeHandleComponent={{
                        bottomRight: <HandleComponent />,
                        bottomLeft: <HandleComponent />,
                        topLeft: <HandleComponent />,
                        topRight: <HandleComponent />,
                    }}
                    className="absolute z-20 border-[3px] border-primary"
                >
                    <div className="relative size-full">
                        <NextImage src={imageURL} fill alt="your image" className="pointer-events-none" />
                    </div>
                </Rnd>
            </div>
            <div className="h-[37.5rem] w-full col-span-full lg:col-span-1 flex flex-col bg-white">
                <ScrollArea className="relative flex-1 overflow-auto">
                    <div
                        className="absolute z-10 insex-x-0 bottom-0 h-12 bg-gradient-to-r from-white pointer-events-none"
                        aria-hidden="true"
                    />
                    <div className="px-8 pb-12 pt-8">
                        <h2 className="tracking-tight font-bold text-3xl">Customize your case</h2>

                        <div className="w-full h-px bg-zinc-200 my-6" />

                        <div className="relative mt-4 h-full flex flex-col justify-between">
                            <div className="flex flex-col gap-6">
                                <RadioGroup
                                    value={options.color}
                                    onChange={(val) => setOptions((prev) => ({ ...prev, color: val }))}
                                >
                                    <Label>Color: {options.color.label}</Label>
                                    <div className="mt-3 flex items-center space-x-3">
                                        {COLORS.map((color) => (
                                            <Radio
                                                key={color.label}
                                                value={color}
                                                className={({ checked }) =>
                                                    cn(
                                                        "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 active:ring-0 focus:ring-0 active:outline-none focus:outline-none border-2 border-transparent",
                                                        {
                                                            [`border-${color.tw}`]: checked,
                                                        }
                                                    )
                                                }
                                            >
                                                <span
                                                    className={cn(
                                                        `bg-${color.tw}`,
                                                        "h-8 w-8 rounded-full border border-black border-opacity-10"
                                                    )}
                                                />
                                            </Radio>
                                        ))}
                                    </div>
                                </RadioGroup>
                                <div className="relative flex flex-col gap-3 w-full">
                                    <Label>Model</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between"
                                            >
                                                {options.model.label}
                                                <ChevronsUpDown className="size-4 ml-2 shrink-0 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {MODELS.options.map((model) => (
                                                <DropdownMenuItem
                                                    key={model.label}
                                                    className={cn(
                                                        "flex sm:gap-1 items-center p-1.5 cursor-default hover:bg-zinc-100",
                                                        {
                                                            "bg-zinc-100": model.label === options.model.label,
                                                        }
                                                    )}
                                                    onClick={() => setOptions((prev) => ({ ...prev, model }))}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 size-4",
                                                            model.label === options.model.label
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {model.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {[MATERIALS, FINISHES].map(({ name, options: selectableOptions }) => (
                                        <RadioGroup
                                            key={name}
                                            value={options[name]}
                                            onChange={(val) => setOptions((prev) => ({ ...prev, [name]: val }))}
                                        >
                                            <Label>{name.slice(0, 1).toUpperCase() + name.slice(1)}</Label>
                                            <div className="mt-3 space-y-4">
                                                {selectableOptions.map((option) => (
                                                    <Radio
                                                        key={option.value}
                                                        value={option}
                                                        className={({ checked }) =>
                                                            cn(
                                                                "relative block cursor-pointer rounded-xl bg-white px-6 py-4 shadow-sm border-2 border-zinc-200 focus:outline-none ring-0 focus:ring-0 outline-none sm:flex sm:flex-between",
                                                                {
                                                                    "border-primary": checked,
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <span className="flex item-center">
                                                            <span className="flex flex-col text-sm">
                                                                <RadioLabel
                                                                    as="span"
                                                                    className="font-medium text-gray-900 "
                                                                >
                                                                    {option.label}
                                                                </RadioLabel>
                                                                {option.description ? (
                                                                    <Description as="span" className="text-gray-500">
                                                                        <span className="block sm:inline">
                                                                            {option.description}
                                                                        </span>
                                                                    </Description>
                                                                ) : null}
                                                            </span>
                                                        </span>

                                                        <Description
                                                            as="span"
                                                            className="mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right"
                                                        >
                                                            <span className="font-medium text-gray-900">
                                                                {formatPrice(option.price / 100)}
                                                            </span>
                                                        </Description>
                                                    </Radio>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="w-full px-8 h-16 bg-white">
                    <div className="h-px w-full bg-zinc-200" />
                    <div className="w-full h-full flex justify-end items-center">
                        <div className="w-full flex gap-6 items-center">
                            <p className="font-medium whitespace-nowrap">
                                {formatPrice((BASE_PRICE + options.finish.price + options.material.price) / 100)}
                            </p>
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                    saveConfig({
                                        configId,
                                        color: options.color.value,
                                        finish: options.finish.value,
                                        material: options.material.value,
                                        model: options.model.value,
                                    })
                                }
                            >
                                Continue <ArrowRight className="size-4 ml-1.5 inline" />{" "}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignConfigurator;
