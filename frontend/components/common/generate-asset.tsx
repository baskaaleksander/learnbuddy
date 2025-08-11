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
import { useEffect, useState } from "react";

export function GenerateAssetDialog({
  onGenerateAction,
  isOpen,
  setIsOpenAction,
  assetData,
  submitting,
  triggerText = "Generate",
  availableTokens,
}: {
  onGenerateAction: () => void;
  isOpen: boolean;
  setIsOpenAction: (open: boolean) => void;
  assetData: AssetData;
  submitting: boolean;
  triggerText?: string;
  availableTokens: number;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);

  useEffect(() => {
    setButtonDisabled(availableTokens < assetData.cost);
  }, [availableTokens, assetData.cost]);

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
            <DialogDescription className="flex flex-col gap-2">
              <span>
                {assetData.description}, it will cost you {assetData.cost}{" "}
                <Coins className="w-4 h-4 text-yellow-500 inline" /> unless you
                have a unlimited plan.
              </span>
              {buttonDisabled && (
                <span className="text-red-500 text-sm">
                  You do not have enough tokens to generate this asset.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={buttonDisabled} onClick={onGenerateAction}>
              {triggerText}
            </Button>
            <DialogTrigger asChild>
              <Button data-testid="cancel-button" variant="outline">
                Cancel
              </Button>
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
          {buttonDisabled && (
            <span className="text-red-500 text-sm mb-2 text-center">
              You do not have enough tokens to generate this asset.
            </span>
          )}
          {submitting ? (
            <Button disabled={true} variant="outline">
              <Loader2 className="h-4 w-4 animate-spin" />
              {triggerText} {assetData.title.toLowerCase()}
            </Button>
          ) : (
            <Button
              disabled={buttonDisabled}
              variant="outline"
              onClick={onGenerateAction}
            >
              {triggerText} {assetData.title.toLowerCase()}
            </Button>
          )}
          <DrawerClose asChild>
            <Button data-testid="cancel-button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
