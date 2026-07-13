import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, X, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  avatarPath: string | null;
  onChange: (path: string | null) => void;
  fallbackIcon?: "user" | "wrench";
}

export function AvatarUploader({ userId, avatarPath, onChange, fallbackIcon = "user" }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!avatarPath) { setPreview(null); return; }
      if (avatarPath.startsWith("http")) { setPreview(avatarPath); return; }
      const { data } = await supabase.storage.from("avatars").createSignedUrl(avatarPath, 3600);
      if (active) setPreview(data?.signedUrl ?? null);
    })();
    return () => { active = false; };
  }, [avatarPath]);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setBusy(true);
    setOpen(false);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (upErr) throw upErr;
      if (avatarPath && !avatarPath.startsWith("http")) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
      if (dbErr) throw dbErr;
      onChange(path);
      toast.success("Profile photo updated");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    setOpen(false);
    try {
      if (avatarPath && !avatarPath.startsWith("http")) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      onChange(null);
      toast.success("Photo removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative grid size-24 place-items-center overflow-hidden rounded-full grad-primary text-primary-foreground shadow-lg ring-2 ring-border transition hover:ring-primary sm:size-28"
        aria-label="Change profile photo"
      >
        {busy ? (
          <Loader2 className="size-8 animate-spin" />
        ) : preview ? (
          <img src={preview} alt="Profile" className="size-full object-cover" />
        ) : fallbackIcon === "wrench" ? (
          <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        ) : (
          <UserIcon className="size-10" />
        )}
        <span className="absolute inset-x-0 bottom-0 grid h-8 place-items-center bg-black/55 text-white opacity-90 transition group-hover:opacity-100">
          <Camera className="size-4" />
        </span>
      </button>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Profile photo</SheetTitle></SheetHeader>
          <div className="mt-4 grid gap-2 pb-4">
            <Button variant="secondary" className="justify-start gap-3 py-6" onClick={() => cameraRef.current?.click()}>
              <Camera className="size-5 text-primary" /> Take photo
            </Button>
            <Button variant="secondary" className="justify-start gap-3 py-6" onClick={() => galleryRef.current?.click()}>
              <ImageIcon className="size-5 text-primary" /> Choose from gallery
            </Button>
            {avatarPath && (
              <Button variant="secondary" className="justify-start gap-3 py-6 text-destructive" onClick={removePhoto}>
                <Trash2 className="size-5" /> Remove photo
              </Button>
            )}
            <Button variant="ghost" className="justify-start gap-3 py-6" onClick={() => setOpen(false)}>
              <X className="size-5" /> Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
