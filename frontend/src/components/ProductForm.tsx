import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  ImagePlus,
  Save,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "./reui/alert";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./reui/stepper";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { formatBytes, useFileUpload } from "../hooks/use-file-upload";
import { cn } from "../lib/utils";
import type { Product, ProductFormValues } from "../types";

type ProductFormProps = {
  initialProduct?: Product;
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

export function ProductForm({
  initialProduct,
  isSubmitting,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    title: initialProduct?.title ?? "",
    description: initialProduct?.description ?? "",
    unit_price: initialProduct?.unit_price ?? "",
    available_quantity: initialProduct
      ? String(initialProduct.available_quantity)
      : "",
    image: null,
  });

  const isEditing = Boolean(initialProduct);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="product-title">Title</Label>
        <Input
          id="product-title"
          required
          maxLength={255}
          value={values.title}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="product-price">Unit price</Label>
        <Input
          id="product-price"
          required
          min="0.01"
          step="0.01"
          type="number"
          value={values.unit_price}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              unit_price: event.target.value,
            }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="product-quantity">Available quantity</Label>
        <Input
          id="product-quantity"
          required
          min="0"
          step="1"
          type="number"
          value={values.available_quantity}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              available_quantity: event.target.value,
            }))
          }
        />
      </div>
      <div className="col-span-full grid gap-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          required
          rows={5}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </div>
      <label className="col-span-full flex flex-col gap-3 rounded-lg border border-dashed bg-muted/50 p-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ImagePlus aria-hidden="true" size={18} />
          Product image
        </span>
        <Input
          required={!isEditing}
          type="file"
          accept="image/*"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              image: event.target.files?.[0] ?? null,
            }))
          }
        />
      </label>
      <div className="col-span-full flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save aria-hidden="true" size={18} />
          {isSubmitting ? "Saving" : isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

type ProductStepFormProps = {
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

const PRODUCT_STEPS = [
  "Image",
  "Name",
  "Description",
  "Price",
  "Quantity",
  "Review",
] as const;

export function ProductStepForm({ isSubmitting, onSubmit }: ProductStepFormProps) {
  const [step, setStep] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [values, setValues] = useState<ProductFormValues>({
    title: "",
    description: "",
    unit_price: "",
    available_quantity: "",
    image: null,
  });

  const [{ files, isDragging, errors }, upload] = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onFilesChange(nextFiles) {
      const selectedFile = nextFiles[0]?.file;
      setValues((current) => ({
        ...current,
        image: selectedFile instanceof File ? selectedFile : null,
      }));
    },
  });
  const previewUrl = files[0]?.preview ?? "";
  const selectedUpload = files[0];
  const selectedFile = selectedUpload?.file;
  const isReviewStep = step === PRODUCT_STEPS.length - 1;
  const canMoveNext = isCurrentStepValid(values, step);
  const isFullscreenPreviewOpen = Boolean(previewUrl) && isPreviewOpen;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReviewStep) {
      if (canMoveNext) {
        setStep((current) => Math.min(PRODUCT_STEPS.length - 1, current + 1));
      }
      return;
    }

    await onSubmit(values);
  }

  function handleFieldKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || isReviewStep) {
      return;
    }

    event.preventDefault();
    if (canMoveNext) {
      setStep((current) => Math.min(PRODUCT_STEPS.length - 1, current + 1));
    }
  }

  function removeSelectedImage() {
    if (selectedUpload) {
      setIsPreviewOpen(false);
      upload.removeFile(selectedUpload.id);
    }
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border bg-white p-[clamp(1rem,4vw,1.5rem)]"
      onSubmit={handleSubmit}
    >
      <Stepper
        value={step + 1}
        onValueChange={(value) => {
          const nextStep = value - 1;
          if (nextStep <= step) {
            setStep(nextStep);
          }
        }}
      >
        <StepperNav className="grid grid-cols-6 gap-1">
          {PRODUCT_STEPS.map((label, index) => (
            <StepperItem
              key={label}
              step={index + 1}
              completed={index < step}
              disabled={index > step}
              className="min-w-0 justify-stretch"
            >
              <StepperTrigger className="grid w-full grid-cols-[auto_1fr] items-center gap-2 rounded-none border-0 border-b-[3px] border-b-neutral-200 bg-transparent px-0 py-2 text-left text-neutral-600 data-[state=active]:border-b-black data-[state=active]:text-black data-[state=completed]:border-b-black data-[state=completed]:text-black max-[820px]:flex max-[820px]:justify-center max-[820px]:px-0.5">
                <StepperIndicator className="size-6 text-xs font-black">
                  {index + 1}
                </StepperIndicator>
                <StepperTitle className="truncate text-xs font-black uppercase max-[820px]:sr-only">
                  {label}
                </StepperTitle>
              </StepperTrigger>
              {index < PRODUCT_STEPS.length - 1 ? (
                <StepperSeparator className="hidden" />
              ) : null}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
      <p className="text-xs font-extrabold uppercase text-[var(--app-accent)]">
        Step {step + 1} of {PRODUCT_STEPS.length}
        <span className="hidden max-[820px]:inline">
          {" "}
          · {PRODUCT_STEPS[step]}
        </span>
      </p>
      {step === 0 ? (
        <div
          className={cn(
            "relative grid min-h-[22rem] gap-4 rounded-lg border border-dashed p-5 transition-colors max-[820px]:min-h-[18rem] max-[820px]:p-4",
            previewUrl ? "bg-white" : "place-items-center bg-neutral-100 text-center",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
          )}
          onDragEnter={upload.handleDragEnter}
          onDragLeave={upload.handleDragLeave}
          onDragOver={upload.handleDragOver}
          onDrop={upload.handleDrop}
        >
          <input
            {...upload.getInputProps({ accept: "image/*", multiple: false })}
            className="sr-only"
          />
          {previewUrl && selectedUpload ? (
            <div className="grid grid-cols-[minmax(10rem,0.75fr)_1fr] items-center gap-4 max-[820px]:grid-cols-1">
              <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-[820px]:bg-transparent max-[820px]:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-full shadow-md ring-1 ring-white/70"
                    onClick={() => setIsPreviewOpen(true)}
                    aria-label="Open image preview"
                  >
                    <ZoomIn aria-hidden="true" size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-full shadow-md ring-1 ring-white/70"
                    onClick={removeSelectedImage}
                    aria-label="Remove product image"
                  >
                    <X aria-hidden="true" size={16} />
                  </Button>
                </div>
              </div>
              <div className="grid justify-items-start gap-3 text-left">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted">
                  <ImageIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                </span>
                <div className="grid gap-1">
                  <span className="text-sm font-black uppercase text-black">
                    Product image selected
                  </span>
                  {selectedFile ? (
                    <small className="font-bold text-neutral-600">
                      {selectedFile.name} · {formatBytes(selectedFile.size)}
                    </small>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={upload.openFileDialog}>
                    <Upload aria-hidden="true" size={16} />
                    Change image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeSelectedImage}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-4">
              <span
                className={cn(
                  "inline-flex size-16 items-center justify-center rounded-full",
                  isDragging ? "bg-primary/10" : "bg-muted",
                )}
              >
                <ImageIcon
                  aria-hidden="true"
                  className={cn(
                    "size-6",
                    isDragging ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </span>
              <div className="grid gap-1">
                <span className="text-sm font-black uppercase text-black">
                  Upload product image
                </span>
                <small className="font-bold text-neutral-600">
                  Drag and drop an image here or browse your files.
                </small>
                <small className="text-xs font-bold text-neutral-500">
                  JPEG, PNG, GIF, or WebP up to 10 MB.
                </small>
              </div>
              <Button type="button" onClick={upload.openFileDialog}>
                <Upload aria-hidden="true" size={16} />
                Browse image
              </Button>
            </div>
          )}
          {errors.length > 0 ? (
            <Alert variant="destructive" className="mt-1">
              <AlertTitle>Image upload error</AlertTitle>
              <AlertDescription>
                {errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
      {step === 1 ? (
        <label className="flex min-h-96 flex-col justify-center gap-3 max-[820px]:min-h-72">
          <span className="text-sm font-black uppercase text-black">Product name</span>
          <Input
            className="h-auto rounded-none border-0 border-b-2 border-b-black bg-transparent px-0 py-3 text-[clamp(1.6rem,5vw,3.6rem)] font-black shadow-none focus-visible:ring-0"
            required
            autoFocus
            maxLength={255}
            placeholder="Water bottle"
            value={values.title}
            onKeyDown={handleFieldKeyDown}
            onChange={(event) =>
              setValues((current) => ({ ...current, title: event.target.value }))
            }
          />
        </label>
      ) : null}
      {step === 2 ? (
        <label className="flex min-h-96 flex-col justify-center gap-3 max-[820px]:min-h-72">
          <span className="text-sm font-black uppercase text-black">Description</span>
          <Textarea
            className="min-h-40 resize-y rounded-none border-0 border-b-2 border-b-black bg-transparent px-0 py-3 text-[clamp(1.2rem,3vw,2.2rem)] leading-tight font-normal shadow-none focus-visible:ring-0"
            required
            autoFocus
            rows={6}
            placeholder="Describe the item, condition, and fit."
            value={values.description}
            onKeyDown={handleFieldKeyDown}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </label>
      ) : null}
      {step === 3 ? (
        <label className="flex min-h-96 flex-col justify-center gap-3 max-[820px]:min-h-72">
          <span className="text-sm font-black uppercase text-black">Price</span>
          <Input
            className="h-auto rounded-none border-0 border-b-2 border-b-black bg-transparent px-0 py-3 text-[clamp(1.6rem,5vw,3.6rem)] font-black shadow-none focus-visible:ring-0"
            required
            autoFocus
            min="0.01"
            step="0.01"
            type="number"
            placeholder="38.00"
            value={values.unit_price}
            onKeyDown={handleFieldKeyDown}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                unit_price: event.target.value,
              }))
            }
          />
        </label>
      ) : null}
      {step === 4 ? (
        <label className="flex min-h-96 flex-col justify-center gap-3 max-[820px]:min-h-72">
          <span className="text-sm font-black uppercase text-black">Available quantity</span>
          <Input
            className="h-auto rounded-none border-0 border-b-2 border-b-black bg-transparent px-0 py-3 text-[clamp(1.6rem,5vw,3.6rem)] font-black shadow-none focus-visible:ring-0"
            required
            autoFocus
            min="0"
            step="1"
            type="number"
            placeholder="12"
            value={values.available_quantity}
            onKeyDown={handleFieldKeyDown}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                available_quantity: event.target.value,
              }))
            }
          />
        </label>
      ) : null}
      {isReviewStep ? (
        <div className="grid min-h-96 grid-cols-[minmax(11rem,0.45fr)_1fr] items-center gap-4 max-[820px]:min-h-72 max-[820px]:grid-cols-1">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="aspect-square w-full bg-neutral-200 object-cover"
            />
          ) : null}
          <div>
            <span className="text-sm font-black uppercase text-black">Ready to post</span>
            <h2 className="my-1 text-[clamp(2rem,6vw,4.2rem)] font-black uppercase">
              {values.title}
            </h2>
            <p className="text-base text-neutral-700">{values.description}</p>
            <strong className="mt-2 block text-xl font-black text-black">
              ${Number(values.unit_price).toFixed(2)}
            </strong>
            <small className="mt-2 block text-xl font-black text-black">
              {values.available_quantity} available
            </small>
          </div>
        </div>
      ) : null}
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || isSubmitting}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Back
        </Button>
        <Button
          type="submit"
          className="min-w-[8.5rem]"
          disabled={!canMoveNext || isSubmitting}
        >
          {isReviewStep ? (
            <>
              <Save aria-hidden="true" size={18} />
              {isSubmitting ? "Saving" : "Save"}
            </>
          ) : (
            <>
              <ArrowRight aria-hidden="true" size={18} />
              Next
            </>
          )}
        </Button>
      </div>
      <DialogPrimitive.Root
        open={isFullscreenPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none">
            <DialogPrimitive.Title className="sr-only">
              Product image preview
            </DialogPrimitive.Title>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Product preview fullscreen"
                className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] rounded-lg object-contain shadow-2xl"
              />
            ) : null}
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 size-10 rounded-full text-white hover:bg-white/10 hover:text-white"
                aria-label="Close image preview"
              >
                <X aria-hidden="true" size={28} />
              </Button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </form>
  );
}

function isCurrentStepValid(values: ProductFormValues, step: number) {
  if (step === 0) {
    return Boolean(values.image);
  }
  if (step === 1) {
    return values.title.trim().length > 0;
  }
  if (step === 2) {
    return values.description.trim().length > 0;
  }
  if (step === 3) {
    return Number(values.unit_price) > 0;
  }
  if (step === 4) {
    return Number(values.available_quantity) >= 0;
  }

  return true;
}
