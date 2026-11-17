"use client";

import { Lock, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import SignInLink from "@/components/SignInLink";
import { getToken, parseUserCookie, USER_COOKIE } from "@/lib/auth";
import {
  addComment,
  deleteComment,
  deleteVideo,
  getVideo,
  listComments,
  recordView,
  streamUrl,
  toggleLike,
  updateVideo,
  VideoComment,
  VideoDto,
} from "@/lib/video";

function currentUserId(): string | null {
  const m = document.cookie.split("; ").find((c) => c.startsWith(`${USER_COOKIE}=`));
  return parseUserCookie(m?.slice(USER_COOKIE.length + 1))?.id ?? null;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [video, setVideo] = useState<VideoDto | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const counted = useRef(false);

  const load = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([getVideo(id), listComments(id)]);
      setVideo(v);
      setComments(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this video.");
    }
  }, [id]);

  useEffect(() => {
    setUserId(currentUserId());
    load();
  }, [load]);

  const guard = async (fn: () => Promise<unknown>) => {
    try {
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const onPlay = () => {
    if (counted.current) return;
    counted.current = true;
    recordView(id).then((r) => setVideo((v) => (v ? { ...v, views: r.views } : v))).catch(() => undefined);
  };

  const onLike = () =>
    guard(async () => {
      const r = await toggleLike(id);
      setVideo((v) => (v ? { ...v, liked: r.liked, likeCount: r.likeCount } : v));
    });

  const onComment = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    guard(async () => {
      const c = await addComment(id, text.trim());
      setComments((prev) => [c, ...prev]);
      setText("");
    });
  };

  const isOwner = Boolean(video && userId && video.ownerId === userId);
  const signedIn = typeof document !== "undefined" && Boolean(getToken());

  return (
    <main>
      <Header />
      <div className="page max-w-5xl pt-8">
        {error && (
          <p className="mb-3 border-2 border-danger bg-surface px-3 py-2 text-sm font-bold text-danger">
            {error} {error.includes("sign in") && <SignInLink className="underline">Sign in</SignInLink>}
          </p>
        )}
        {!video && !error && <p className="text-mute">Loading…</p>}

        {video && (
          <>
            <video key={video.id} src={streamUrl(video)} controls preload="metadata" onPlay={onPlay}
              className="aspect-video w-full border-4 border-line bg-black" />
            <h1 className="display mt-6 text-4xl sm:text-5xl">{video.title}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y-2 border-line py-3 text-sm font-semibold">
              <span>
                {video.ownerName} · {video.views} view{video.views === 1 ? "" : "s"} ·{" "}
                {new Date(video.createdAt).toLocaleDateString()}
                {video.visibility === "private" && (
                  <span className="ml-2 inline-flex items-center gap-0.5 align-middle"><Lock size={12} /> Private</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={onLike}
                  className={`kicker flex items-center gap-1.5 border-2 border-line px-3.5 py-2 transition-colors ${video.liked ? "bg-accent text-white" : "bg-surface hover:bg-mustard"}`}>
                  <ThumbsUp size={15} /> {video.likeCount}
                </button>
                {isOwner && (
                  <>
                    <button className="btn-ghost"
                      onClick={() => guard(async () => {
                        const next = video.visibility === "public" ? "private" : "public";
                        setVideo(await updateVideo(id, { visibility: next }));
                      })}>
                      Make {video.visibility === "public" ? "private" : "public"}
                    </button>
                    <button className="btn-danger"
                      onClick={() => {
                        if (window.confirm("Delete this video permanently? This can't be undone.")) {
                          guard(async () => { await deleteVideo(id); router.push("/videos"); });
                        }
                      }}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            {video.description && (
              <p className="card mt-5 whitespace-pre-wrap p-4 text-sm font-medium leading-relaxed">{video.description}</p>
            )}

            <h2 className="display mb-4 mt-10 border-b-4 border-line pb-2 text-3xl">{video.commentCount} comment{video.commentCount === 1 ? "" : "s"}</h2>
            {signedIn ? (
              <form onSubmit={onComment} className="mb-6 flex gap-2">
                <input className="input flex-1"
                  placeholder="Add a comment…" value={text} maxLength={2000}
                  onChange={(e) => setText(e.target.value)} />
                <button type="submit" className="btn-primary">Comment</button>
              </form>
            ) : (
              <p className="mb-6 text-sm text-mute">
                <SignInLink className="link">Sign in</SignInLink> to like or comment.
              </p>
            )}
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <span className="font-black uppercase">{c.userName}</span>{" "}
                    <span className="text-xs text-mute">{new Date(c.createdAt).toLocaleString()}</span>
                    <p className="whitespace-pre-wrap">{c.text}</p>
                  </div>
                  {c.canDelete && (
                    <button title="Delete comment" className="icon-btn hover:!text-danger"
                      onClick={() => guard(async () => {
                        await deleteComment(id, c.id);
                        setComments((prev) => prev.filter((x) => x.id !== c.id));
                        setVideo((v) => (v ? { ...v, commentCount: v.commentCount - 1 } : v));
                      })}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
