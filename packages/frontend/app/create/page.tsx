"use client";

import { FileUpload } from "@/components/ui/file-upload";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@clerk/nextjs";
import { Settings, Sparkles, Upload, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

export default function Create() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [clipLength, setClipLength] = useState([60]);
  const [enableCaptions, setEnableCaptions] = useState(true);
  const [timeframeStart, setTimeframeStart] = useState("");
  const [timeframeEnd, setTimeframeEnd] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [, setResult] = useState<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState("default");
  const { getToken } = useAuth();
  const router = useRouter();

  const getOptions = () => ({
    clipLength: clipLength[0],
    enableCaptions,
    timeframe: { start: timeframeStart, end: timeframeEnd },
    captionStyle,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (activeTab === "url") {
      await handleUrlSubmit();
    } else {
      await handleFileSubmit();
    }
  };

  const handleUrlSubmit = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/content/atomize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, ...getOptions() }),
      });
      if (!response.ok) throw new Error("Something went wrong");
      const data = await response.json();
      setResult(data.message);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setResult("Failed to start atomization.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    setResult(null);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      const options = getOptions();
      formData.append("clipLength", String(options.clipLength));
      formData.append("enableCaptions", String(options.enableCaptions));
      formData.append("timeframeStart", options.timeframe.start);
      formData.append("timeframeEnd", options.timeframe.end);
      formData.append("captionStyle", options.captionStyle);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/content/atomize-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Something went wrong");
      const data = await response.json();
      setResult(data.message);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setResult("Failed to start atomization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden">
      <BackgroundBeams className="opacity-30 dark:opacity-50" />
      <div className="relative z-10">
        <Header />
        <div className="relative pt-32 pb-32">
          <div className="max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="text-center space-y-4 mb-16 relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-16 bg-gradient-to-b from-transparent to-border -mt-20" />
              <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground">Initialize Project</h2>
              <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
                Configure parameters for content atomization
              </p>
            </div>

            {/* Main Instrument Panel */}
            <div className="relative border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl rounded-2xl overflow-hidden">
              <form onSubmit={handleSubmit} className="space-y-12">

                {/* Input Source Selection */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 border-b border-border pb-4">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-lg tracking-tight text-foreground">Input Source</h3>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1 gap-1 h-auto">
                      <TabsTrigger value="url" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm h-12 font-medium text-sm transition-all text-muted-foreground">
                        <Upload className="w-4 h-4 mr-2" />
                        YouTube URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm h-12 font-medium text-sm transition-all text-muted-foreground">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Upload File
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="mt-8">
                      <div className="space-y-3">
                        <Label htmlFor="url" className="font-mono text-xs uppercase font-bold text-muted-foreground">Target URL</Label>
                        <div className="relative group">
                          <Input
                            id="url"
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="rounded-xl border-border h-14 font-mono pl-4 focus:ring-0 focus:border-emerald-500 transition-colors bg-background text-foreground"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-8">
                      <div className="w-full min-h-[300px] border border-dashed border-border rounded-2xl bg-muted/20">
                        <FileUpload onChange={(files) => setFile(files[0] || null)} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Configuration Matrix */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 border-b border-border pb-4">
                    <div className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-lg tracking-tight text-foreground">Configuration Matrix</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Column */}
                    <div className="space-y-8">
                      <div className="space-y-4 group">
                        <div className="flex justify-between items-end">
                          <Label className="font-mono text-xs uppercase font-bold text-muted-foreground group-hover:text-emerald-500 transition-colors">Clip Duration</Label>
                          <span className="font-mono text-xl font-bold text-foreground">{clipLength}s</span>
                        </div>
                        <Slider
                          value={clipLength}
                          onValueChange={setClipLength}
                          max={180}
                          min={15}
                          step={15}
                          className="w-full py-4"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                          <span>15s</span>
                          <span>180s</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="font-mono text-xs uppercase font-bold text-muted-foreground">Timeframe (Optional)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="00:00"
                            value={timeframeStart}
                            onChange={(e) => setTimeframeStart(e.target.value)}
                            className="rounded-xl font-mono text-center h-12 border-border focus:border-emerald-500 bg-background text-foreground transition-colors"
                          />
                          <Input
                            placeholder="00:00"
                            value={timeframeEnd}
                            onChange={(e) => setTimeframeEnd(e.target.value)}
                            className="rounded-xl font-mono text-center h-12 border-border focus:border-emerald-500 bg-background text-foreground transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border border-border rounded-xl p-6 hover:border-emerald-500/50 bg-muted/20 transition-colors duration-300 group cursor-pointer">
                        <div className="space-y-1">
                          <Label htmlFor="captions" className="font-bold tracking-tight cursor-pointer group-hover:text-emerald-500 text-foreground transition-colors">Neural Captions</Label>
                          <p className="text-xs text-muted-foreground font-mono">AI-generated subtitles</p>
                        </div>
                        <Switch
                          id="captions"
                          checked={enableCaptions}
                          onCheckedChange={setEnableCaptions}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caption-style" className="font-mono text-xs uppercase font-bold text-muted-foreground">Caption Style</Label>
                        <Select
                          value={captionStyle}
                          onValueChange={setCaptionStyle}
                        >
                          <SelectTrigger id="caption-style" className="w-full rounded-xl border-border h-12 focus:ring-0 focus:border-emerald-500 bg-background text-foreground">
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                            <SelectItem value="default" className="cursor-pointer">Standard</SelectItem>
                            <SelectItem value="highlight" className="cursor-pointer">Highlight</SelectItem>
                            <SelectItem value="karaoke" className="cursor-pointer">Karaoke</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Area */}
                <div className="pt-8 flex justify-center">
                  <HoverBorderGradient
                    containerClassName="rounded-xl w-full"
                    as="button"
                    className="w-full bg-foreground text-background flex items-center justify-center space-x-2 h-14 font-bold text-lg"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-3 h-5 w-5 border-2 border-background border-t-transparent rounded-full"></span>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <span>Initiate Sequence</span>
                        <Zap className="ml-2 w-5 h-5 text-emerald-500" />
                      </>
                    )}
                  </HoverBorderGradient>
                </div>

              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

