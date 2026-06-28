"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Captions,
  Clock,
  Film,
  Link2,
  Loader2,
  Lock,
  MessageSquareQuote,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription } from "@/hooks/use-subscription";

const ease = [0.16, 1, 0.3, 1] as const;

type SubmitState = "idle" | "submitting" | "error";

export default function CreatePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isProFeatureAvailable } = useSubscription();

  const [activeTab, setActiveTab] = React.useState<"url" | "upload">("url");
  const [url, setUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  const [clipLength, setClipLength] = React.useState<number[]>([60]);
  const [enableCaptions, setEnableCaptions] = React.useState(true);
  const [captionStyle, setCaptionStyle] = React.useState("default");
  const [voiceTemplate, setVoiceTemplate] = React.useState("auto");
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [timeframeStart, setTimeframeStart] = React.useState("");
  const [timeframeEnd, setTimeframeEnd] = React.useState("");

  const [submit, setSubmit] = React.useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [upgradeModalFeature, setUpgradeModalFeature] = React.useState<string | null>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8080";

  const canSubmit =
    submit !== "submitting" &&
    (activeTab === "url" ? url.trim().length > 0 : Boolean(file));

  const getOptions = () => ({
    clipLength: clipLength[0],
    enableCaptions,
    timeframe: { start: timeframeStart, end: timeframeEnd },
    captionStyle,
    voiceTemplate: voiceTemplate === "auto" ? "" : voiceTemplate,
    customPrompt,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmit("submitting");
    setErrorMsg(null);
    try {
      if (activeTab === "url") {
        const token = await getToken();
        const res = await fetch(`${apiBase}/api/v1/content/atomize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ url, ...getOptions() }),
        });
        if (!res.ok) {
          if (res.status === 403) {
            const data = await res.json().catch(() => ({}));
            if (data.code === 'ATOMIZATION_LIMIT_REACHED') {
              setSubmit("idle");
              setUpgradeModalFeature("Project limit reached");
              return;
            }
          }
          throw new Error(
            (await res.text().catch(() => "")) ||
              "Failed to start atomization."
          );
        }
      } else if (file) {
        const token = await getToken();
        const opts = getOptions();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clipLength", String(opts.clipLength));
        formData.append("enableCaptions", String(opts.enableCaptions));
        formData.append("timeframeStart", opts.timeframe.start);
        formData.append("timeframeEnd", opts.timeframe.end);
        formData.append("captionStyle", opts.captionStyle);
        formData.append("voiceTemplate", opts.voiceTemplate);
        formData.append("customPrompt", opts.customPrompt);
        const res = await fetch(`${apiBase}/api/v1/content/atomize-file`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });
        if (!res.ok) {
          if (res.status === 403) {
            const data = await res.json().catch(() => ({}));
            if (data.code === 'ATOMIZATION_LIMIT_REACHED') {
              setSubmit("idle");
              setUpgradeModalFeature("Project limit reached");
              return;
            }
          }
          throw new Error(
            (await res.text().catch(() => "")) ||
              "Failed to start atomization."
          );
        }
      }
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setSubmit("error");
      setErrorMsg(
        err instanceof Error
          ? err.message.slice(0, 240)
          : "We couldn't start your job. Please try again."
      );
    }
  };

  return (
    <>
      <Header />
      <main className="relative pt-32 pb-24 min-h-screen">
        {/* Soft brand glow upper centre, matches landing language */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-[420px] w-[80%] -z-10"
          style={{
            background:
              "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
            opacity: 0.6,
          }}
        />

        <div className="container-page max-w-6xl">
          <SubscriptionBanner />
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="mb-12 max-w-2xl"
          >
            <p className="eyebrow mb-4">New project</p>
            <h1 className="section-title">
              Drop in a video.{" "}
              <span className="text-muted-foreground">
                Get a month of content.
              </span>
            </h1>
            <p className="section-lede mt-5">
              Paste a YouTube link or upload a file. Choose your output settings
              once — we&apos;ll handle the rest in the background.
            </p>
          </motion.header>

          {/* Two-column layout */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8"
          >
            {/* ── Main column ─────────────────────────── */}
            <div className="space-y-8">
              <Panel
                eyebrow="01 · Source"
                title="Where's your video?"
                icon={<Film className="h-3.5 w-3.5" />}
              >
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "url" | "upload")}
                  className="w-full"
                >
                  <TabsList className="h-9 p-0.5 bg-secondary/60 border border-border rounded-md">
                    <TabsTrigger
                      value="url"
                      className="h-8 px-3 text-[13px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Paste URL
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="h-8 px-3 text-[13px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                      Upload file
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="mt-5">
                    <Label
                      htmlFor="url"
                      className="block text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2"
                    >
                      YouTube URL
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      autoComplete="off"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-11 rounded-md font-mono text-[13.5px] bg-background border-border focus-visible:ring-1 focus-visible:ring-brand/50 focus-visible:border-brand/40"
                    />
                    <p className="mt-2 text-[12.5px] text-muted-foreground">
                      Public videos only. We respect creator copyright — only
                      atomize content you own or have rights to.
                    </p>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-5">
                    <div className="rounded-md border border-dashed border-border bg-secondary/30 overflow-hidden">
                      <FileUpload
                        onChange={(files) => setFile(files[0] || null)}
                      />
                    </div>
                    {file && (
                      <p className="mt-2.5 text-[12.5px] text-muted-foreground font-mono truncate">
                        {file.name}
                        <span className="ml-2 text-foreground/60">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </Panel>

              <Panel
                eyebrow="02 · Output"
                title="How should we cut it?"
                icon={<Scissors className="h-3.5 w-3.5" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  {/* Clip length */}
                  <div>
                    <div className="flex items-end justify-between mb-3">
                      <Label className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                        Clip length
                      </Label>
                      <span className="font-heading text-[20px] tracking-[-0.02em] font-semibold text-foreground tabular-nums">
                        {clipLength[0]}
                        <span className="ml-0.5 text-[12px] font-mono text-muted-foreground">
                          s
                        </span>
                      </span>
                    </div>
                    <Slider
                      value={clipLength}
                      onValueChange={setClipLength}
                      max={180}
                      min={15}
                      step={15}
                      className="w-full"
                    />
                    <div className="mt-2 flex justify-between text-[10.5px] font-mono text-muted-foreground/70">
                      <span>15s</span>
                      <span>180s</span>
                    </div>
                  </div>

                  {/* Timeframe */}
                  <div>
                    <Label className="block text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
                      Time range
                      <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <Input
                          placeholder="00:00"
                          value={timeframeStart}
                          onChange={(e) => setTimeframeStart(e.target.value)}
                          className="h-10 pl-8 font-mono text-[13px] rounded-md bg-background border-border"
                        />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <Input
                          placeholder="end"
                          value={timeframeEnd}
                          onChange={(e) => setTimeframeEnd(e.target.value)}
                          className="h-10 pl-8 font-mono text-[13px] rounded-md bg-background border-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Captions row */}
                <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    htmlFor="captions"
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 h-14 cursor-pointer",
                      "transition-colors duration-200 hover:border-foreground/20"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Captions className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-foreground">
                          Burn-in captions
                        </div>
                        <div className="text-[12px] text-muted-foreground truncate">
                          AI-generated subtitles, on every clip
                        </div>
                      </div>
                    </div>
                    <Switch
                      id="captions"
                      checked={enableCaptions}
                      onCheckedChange={setEnableCaptions}
                      className="data-[state=checked]:bg-brand"
                    />
                  </label>

                  <div className="rounded-md border border-border bg-card px-4 h-14 flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                        Caption style
                      </div>
                    </div>
                    <Select value={captionStyle} onValueChange={setCaptionStyle}>
                      <SelectTrigger className="h-9 w-[120px] rounded-md text-[13px] border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Standard</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                        <SelectItem value="karaoke">Karaoke</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Panel>
              {/* 03 · Creative direction (Pro) */}
              <Panel
                eyebrow="03 · Creative direction"
                title="Shape the voice & angle"
                icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              >
                <div className="relative">
                  {!isProFeatureAvailable && (
                    <button
                      type="button"
                      onClick={() => setUpgradeModalFeature("Creative direction")}
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-[2px]"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium shadow-sm">
                        <Lock className="h-3.5 w-3.5" /> Pro feature — upgrade to unlock
                      </span>
                    </button>
                  )}
                  <div
                    className={cn(
                      "space-y-6",
                      !isProFeatureAvailable && "pointer-events-none select-none opacity-50"
                    )}
                  >
                    <div>
                      <Label className="block text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
                        Tone template
                      </Label>
                      <Select value={voiceTemplate} onValueChange={setVoiceTemplate} disabled={!isProFeatureAvailable}>
                        <SelectTrigger className="h-10 rounded-md text-[13px] border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto · use my brand voice</SelectItem>
                          <SelectItem value="punchy">Punchy & bold</SelectItem>
                          <SelectItem value="analytical">Thoughtful & analytical</SelectItem>
                          <SelectItem value="casual">Friendly & casual</SelectItem>
                          <SelectItem value="authoritative">Authoritative expert</SelectItem>
                          <SelectItem value="storytelling">Storytelling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
                        <MessageSquareQuote className="h-3.5 w-3.5" /> Custom prompt
                        <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        disabled={!isProFeatureAvailable}
                        maxLength={1000}
                        placeholder="e.g. Emphasize the technical takeaways, add a contrarian angle, keep it founder-to-founder."
                        className="min-h-[90px] rounded-md border-border bg-background text-[13px]"
                      />
                    </div>
                  </div>
                </div>
              </Panel>            </div>

            {/* ── Summary column ──────────────────────── */}
            <aside className="lg:sticky lg:top-24 self-start">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-secondary/30">
                  <p className="eyebrow text-[10.5px]">Summary</p>
                </div>
                <dl className="px-5 py-4 space-y-3 text-[13px]">
                  <Row label="Source">
                    <span className="text-foreground">
                      {activeTab === "url" ? "URL" : "Upload"}
                    </span>
                  </Row>
                  <Row label="Clip length">
                    <span className="text-foreground font-mono">
                      {clipLength[0]}s
                    </span>
                  </Row>
                  <Row label="Captions">
                    <span className="text-foreground">
                      {enableCaptions ? "On" : "Off"}
                    </span>
                  </Row>
                  {enableCaptions && (
                    <Row label="Caption style">
                      <span className="text-foreground capitalize">
                        {captionStyle}
                      </span>
                    </Row>
                  )}
                  {(timeframeStart || timeframeEnd) && (
                    <Row label="Time range">
                      <span className="text-foreground font-mono">
                        {timeframeStart || "00:00"}–{timeframeEnd || "end"}
                      </span>
                    </Row>
                  )}
                </dl>

                <div className="px-5 py-4 border-t border-border space-y-3">
                  {errorMsg && (
                    <p className="text-[12.5px] text-destructive">
                      {errorMsg}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className={cn(
                      "w-full h-10 rounded-md text-[13.5px] font-medium",
                      "bg-foreground text-background hover:opacity-92 disabled:opacity-50",
                      "transition-[opacity,transform] duration-200 active:translate-y-px",
                      "group"
                    )}
                  >
                    {submit === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        Start atomizing
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                  <p className="text-[11.5px] text-muted-foreground text-center">
                    Average pipeline: ~3–8 minutes
                  </p>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </main>
      <Footer />
      <UpgradeModal
        open={upgradeModalFeature !== null}
        onClose={() => setUpgradeModalFeature(null)}
        feature={upgradeModalFeature || undefined}
      />
    </>
  );
}

/* ─── Pieces ─────────────────────────────────────── */

function Panel({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-border">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-secondary border border-border text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="eyebrow text-[10.5px] mb-1">{eyebrow}</p>
          <h2 className="text-[18px] md:text-[19px] font-semibold tracking-[-0.02em] text-foreground leading-tight">
            {title}
          </h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
