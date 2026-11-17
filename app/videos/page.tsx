"use client";

import { Film, Lock, Play, Upload } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import { formatSize } from "@/lib/drive";
import { formatDuration, listVideos, thumbnailUrl, uploadVideo, VideoDto } from "@/lib/video";

function VideoCard({ video }: { video: VideoDto }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="relative aspect-video overflow-hidden border-2 border-line bg-surface2">
        {video.hasThumbnail && !thumbFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl(video)} alt="" className="h-full w-full object-cover"
            onError={() => setThumbFailed(true)} />
        ) : (
          <div className="flex h-full items-center justify-center bg-mustard text-ink">
            <Film size={34} />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-accent/0 opacity-0 transition-opacity group-hover:bg-accent/70 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center border-2 border-line bg-surface text-ink">
            <Play size={20} className="ml-0.5" />
          </span>
        </span>
        {video.duration !== null && (
          <span className="absolute bottom-0 right-0 bg-ink px-2 py-0.5 text-xs font-bold text-canvas">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>
      <h3 className="display mt-3 line-clamp-2 text-xl leading-[0.95] group-hover:text-accent-fg">{video.title}</h3>
      <p className="mt-1.5 text-xs font-semibold text-mute">
        {video.ownerName} · {video.views} view{video.views === 1 ? "" : "s"}
        {video.visibility === "private" && (
          <span className="ml-2 inline-flex items-center gap-0.5 align-middle"><Lock size={11} /> Private</span>
        )}
      </p>
    </Link>
  );
}

export default function VideosPage() {
  const [mine, setMine] = useState(false);
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setVideos((await listVideos(mine)).videos);
    } catch (e) {
      setVideos([]);
      setError(e instanceof Error ? e.message : "Failed to load videos.");
    } finally {
      setLoading(false);
    }
  }, [mine]);

  useEffect(() => {
    load();
  }, [load]);

  const tab = (active: boolean) =>
    `kicker border-2 border-line px-4 py-2.5 transition-colors ${active ? "bg-ink text-canvas" : "bg-surface hover:bg-mustard"}`;

  return (
    <main>
      <Header />
      <div className="page">
        <PageTitle kicker="Section 02 / Moving image" title="Videos" subtitle="Watch what others share, or upload your own.">
          <button className={tab(!mine)} onClick={() => setMine(false)}>Explore</button>
          <button className={tab(mine)} onClick={() => setMine(true)}>My videos</button>
          <button onClick={() => setShowUpload((s) => !s)} className="btn-primary !py-3">
            <Upload size={16} /> Upload
          </button>
        </PageTitle>

        {showUpload && (
          <UploadForm onDone={() => { setShowUpload(false); setMine(true); load(); }} />
        )}

        {error && (
          <p className="mb-4 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
            {error} {error.includes("sign in") && <Link href="/login" className="underline">Sign in</Link>}
          </p>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="card flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center border-2 border-line bg-mustard text-ink">
              <Film size={22} />
            </span>
            <p className="font-medium">{mine ? "You haven't uploaded any videos yet" : "No public videos yet"}</p>
            <p className="mt-1 text-sm text-mute">Hit Upload to publish the first one.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      </div>
    </main>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError("Choose a video file.");
    setBusy(true);
    setError(null);
    try {
      await uploadVideo(file, title.trim() || file.name.replace(/\.[^.]+$/, ""), description, visibility);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mb-8 max-w-xl space-y-3 p-5">
      <label className="flex cursor-pointer flex-col items-center border-2 border-dashed border-line px-4 py-6 text-center text-sm font-semibold transition-colors hover:bg-mustard">
        <Upload size={22} className="mb-2" />
        {file ? (
          <span className="text-ink">{file.name} · {formatSize(file.size)}</span>
        ) : (
          <span>Click to choose a video</span>
        )}
        <input type="file" accept="video/*" hidden
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }} />
      </label>
      <input className="input" placeholder="Title" value={title} maxLength={150}
        onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" placeholder="Description (searchable)" rows={3} value={description}
        onChange={(e) => setDescription(e.target.value)} />
      <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
        <option value="public">Public: anyone can watch and find it in search</option>
        <option value="private">Private: only you</option>
      </select>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Uploading… keep this tab open" : "Publish"}
      </button>
    </form>
  );
}
