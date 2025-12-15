"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  // DialogDescription,
  DialogFooter,
  // DialogHeader,
  // DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showFooter?: boolean;
  isLoading?: boolean;
  hideCancelButton?: boolean;
}

export function CustomModal({
  isOpen,
  setIsOpen,
  // title,
  // description,
  children,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  showFooter = true,
  isLoading = false,
  hideCancelButton = false,
}: CustomModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      if (onCancel) onCancel();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='w-full sm:max-w-md'>
        {/* <DialogHeader>
          <DialogTitle className='font-semibold text-xl text-center'>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className='text-muted-foreground'>
              {description}
            </DialogDescription>
          )}
        </DialogHeader> */}

        <div>{children}</div>

        {showFooter && (
          <DialogFooter className='flex justify-end gap-2 pt-4'>
            {!hideCancelButton && (
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
            )}
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
