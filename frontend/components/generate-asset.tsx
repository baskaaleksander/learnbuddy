"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import useMediaQuery from "@/app/hooks/use-media-query";
import {AssetData} from "@/lib/definitions";
import {Coins} from "lucide-react";


export function GenerateAssetDialog({ onGenerateAction, isOpen, setIsOpenAction, assetData } : { onGenerateAction: () => void, isOpen: boolean, setIsOpenAction: (open: boolean) => void, assetData: AssetData }) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpenAction}>
                <DialogTrigger asChild>
                    <Button variant="outline">Generate {assetData.title.toLowerCase()}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Generate {assetData.title.toLowerCase()}</DialogTitle>
                        <DialogDescription>
                            {assetData.description}, it will cost you {assetData.cost} <Coins className='w-4 h-4 text-yellow-500 inline' /> unless you have a unlimited plan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={onGenerateAction}>Generate</Button>
                        <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpenAction}>
            <DrawerTrigger asChild>
                <Button variant="outline">Generate {assetData.title.toLowerCase()}</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Generate {assetData.title.toLowerCase()}</DrawerTitle>
                    <DrawerDescription>
                        {assetData.description}, it will cost you {assetData.cost} <Coins className='w-4 h-4 text-yellow-500 inline' /> unless you have a unlimited plan.
                    </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="pt-2">
                    <Button onClick={onGenerateAction}>Generate</Button>
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

