import useMediaQuery from "@/app/hooks/use-media-query";
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
import { Loader2 } from "lucide-react";
import React from "react";

function CancelSubDialog({
  onDeleteAction,
  isOpen,
  setIsOpenAction,
  submitting,
}: {
  onDeleteAction: () => void;
  isOpen: boolean;
  setIsOpenAction: (open: boolean) => void;
  submitting: boolean;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpenAction}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel subscription? This action cannot
              be undone. Your subscription will remain active until the end of
              the billing cycle
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {submitting ? (
              <Button variant="destructive" disabled={true}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancel
              </Button>
            ) : (
              <Button variant="destructive" onClick={onDeleteAction}>
                Cancel
              </Button>
            )}
            <DialogTrigger asChild>
              <Button variant="outline">Dismiss</Button>
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpenAction}>
      <DrawerTrigger asChild></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Cancel subscription</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to cancel subscription? This action cannot be
            undone. Your subscription will remain active until the end of the
            billing cycle
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-2">
          {submitting ? (
            <Button variant="destructive" disabled={true}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancel
            </Button>
          ) : (
            <Button variant="destructive" onClick={onDeleteAction}>
              Cancel
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Dismiss</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default CancelSubDialog;
