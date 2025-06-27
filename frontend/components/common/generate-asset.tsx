"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useMediaQuery from "@/app/hooks/use-media-query";
import { AssetData } from "@/lib/definitions";
import { Coins, Loader2 } from "lucide-react";

export function GenerateAssetDialog({
  onGenerateAction,
  isOpen,
  setIsOpenAction,
  assetData,
  submitting,
  triggerText = "Generate",
}: {
  onGenerateAction: () => void;
  isOpen: boolean;
  setIsOpenAction: (open: boolean) => void;
  assetData: AssetData;
  submitting: boolean;
  triggerText?: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpenAction}>
        <DialogTrigger asChild>
          {submitting ? (
            <Button disabled={true} variant="outline">
              <Loader2 className="h-4 w-4 animate-spin" />
              {triggerText}
            </Button>
          ) : (
            <Button variant="outline">{triggerText}</Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {triggerText} {assetData.title.toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              {assetData.description}, it will cost you {assetData.cost}{" "}
              <Coins className="w-4 h-4 text-yellow-500 inline" /> unless you
              have a unlimited plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onGenerateAction}>{triggerText}</Button>
            <DialogTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpenAction}>
      <DrawerTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Generate {assetData.title.toLowerCase()}</DrawerTitle>
          <DrawerDescription>
            {assetData.description}, it will cost you {assetData.cost}{" "}
            <Coins className="w-4 h-4 text-yellow-500 inline" /> unless you have
            a unlimited plan.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-2">
          {submitting ? (
            <Button disabled={true} variant="outline">
              <Loader2 className="h-4 w-4 animate-spin" />
              {triggerText} {assetData.title.toLowerCase()}
            </Button>
          ) : (
            <Button variant="outline" onClick={onGenerateAction}>
              {triggerText} {assetData.title.toLowerCase()}
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
