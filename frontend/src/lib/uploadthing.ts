import { genUploader } from "uploadthing/client";

const { uploadFiles } = genUploader({
  url: "/api/uploadthing",
});

export async function uploadProductImage(file: File, token: string) {
  const [uploadedFile] = await uploadFiles("productImage", {
    files: [file],
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const imageUrl = uploadedFile?.ufsUrl ?? uploadedFile?.url;
  if (!imageUrl) {
    throw new Error("Product image upload did not return a URL.");
  }

  return imageUrl;
}
