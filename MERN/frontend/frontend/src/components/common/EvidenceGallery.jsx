import { resolveEvidenceUrl } from "../../services/evidenceService";

const getRawFileUrl = (evidence) =>
  evidence.previewUrl ??
  evidence.fileUrl ??
  evidence.mediaUrl ??
  evidence.url ??
  evidence.file?.url ??
  evidence.filePath ??
  evidence.path ??
  evidence.imageUrl ??
  evidence.videoUrl ??
  evidence.evidenceUrl;

const isVideo = (evidence, fileUrl) => {
  const type = String(evidence.fileType ?? evidence.mimeType ?? evidence.type ?? "").toLowerCase();

  if (type.includes("video")) {
    return true;
  }

  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(String(fileUrl ?? ""));
};

export const EvidenceGallery = ({ items = [], className = "", emptyMessage = "No evidence uploaded yet." }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="theme-muted text-sm">{emptyMessage}</p>;
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`.trim()}>
      {items.map((evidence, index) => {
        const rawFileUrl = getRawFileUrl(evidence);
        const previewUrl = resolveEvidenceUrl(rawFileUrl);
        const previewIsVideo = isVideo(evidence, rawFileUrl);

        return (
          <article key={String(evidence.id ?? evidence._id ?? index)} className="evidence-frame p-2.5">
            {previewUrl ? (
              previewIsVideo ? (
                <video controls className="h-44 w-full rounded-md bg-black object-cover">
                  <source src={previewUrl} />
                </video>
              ) : (
                <img src={previewUrl} alt="Evidence" className="h-44 w-full rounded-md object-cover" />
              )
            ) : (
              <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-(--border) bg-(--bg-soft) text-sm theme-muted">
                Preview unavailable
              </div>
            )}

            <p className="theme-text mt-2 text-sm">{evidence.caption ?? evidence.description ?? "No caption"}</p>
          </article>
        );
      })}
    </div>
  );
};
