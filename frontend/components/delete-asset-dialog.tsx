import useMediaQuery from "@/app/hooks/use-media-query";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Loader2 } from "lucide-react";

function DeleteAssetDialog({
  onDeleteAction,
  isOpen,
  setIsOpenAction,
  submitting,
  name,
  trigger,
}: {
  onDeleteAction: () => void;
  isOpen: boolean;
  setIsOpenAction: (open: boolean) => void;
  submitting: boolean;
  name: string;
  trigger?: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpenAction}>
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button size="sm" variant="destructive">
              Delete
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete {name.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {name.toLowerCase()}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {submitting ? (
              <Button variant="destructive" disabled={true}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Delete
              </Button>
            ) : (
              <Button variant="destructive" onClick={onDeleteAction}>
                Delete
              </Button>
            )}
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
        {trigger ? (
          trigger
        ) : (
          <Button size="sm" variant="destructive">
            Delete
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Delete {name.toLowerCase()}</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this {name.toLowerCase()}? This
            action cannot be undone.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-2">
          {submitting ? (
            <Button variant="destructive" disabled={true}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Delete
            </Button>
          ) : (
            <Button variant="destructive" onClick={onDeleteAction}>
              Delete
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

export default DeleteAssetDialog;
