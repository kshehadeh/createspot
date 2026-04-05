import { redirect } from "next/navigation";

interface ImageEditorPageProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function ImageEditorPage({
  params,
}: ImageEditorPageProps) {
  const { creatorid, submissionid } = await params;
  redirect(`/creators/${creatorid}/s/${submissionid}/edit`);
}
