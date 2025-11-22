"use client";

import { FileUpload } from "@/components/file-upload";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
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

export default function Create() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [clipLength, setClipLength] = useState([60]);
  const [enableCaptions, setEnableCaptions] = useState(true);
  const [timeframeStart, setTimeframeStart] = useState("");
  const [timeframeEnd, setTimeframeEnd] = useState("");
  const [activeTab, setActiveTab] = useState("url");
  const [result, setResult] = useState<string | null>(null);
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
      const response = await fetch("http://localhost:8080/api/v1/content/atomize", {
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

      const response = await fetch("http://localhost:8080/api/v1/content/atomize-file", {
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
    <div className="min-h-screen bg-transparent">
      <Header />
      <div className="relative pt-32 pb-32">
        <div className="max-w-5xl mx-auto px-6">

          {/* Header */}
          <div className="text-center space-y-4 mb-16 relative">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-16 bg-gradient-to-b from-transparent to-neutral-300 dark:to-neutral-700 -mt-20" />
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">Initialize Project</h2>
            <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">
              Configure parameters for content atomization
            </p>
          </div>

          {/* Main Instrument Panel */}
          <div className="relative border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/80 backdrop-blur-md p-8 md:p-12 shadow-2xl">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black dark:border-white" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black dark:border-white" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black dark:border-white" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black dark:border-white" />

            <form onSubmit={handleSubmit} className="space-y-12">

              {/* Input Source Selection */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <h3 className="font-bold text-lg uppercase tracking-widest">Input Source</h3>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-none bg-transparent p-0 gap-0 border border-neutral-200 dark:border-neutral-800 h-auto">
                    <TabsTrigger value="url" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black h-16 font-mono text-sm uppercase transition-all border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 hover:bg-neutral-100 dark:hover:bg-neutral-900 data-[state=active]:border-transparent relative overflow-visible">
                      <Upload className="w-4 h-4 mr-2" />
                      YouTube URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black h-16 font-mono text-sm uppercase transition-all hover:bg-neutral-100 dark:hover:bg-neutral-900 data-[state=active]:border-transparent relative overflow-visible">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-3">
                      <Label htmlFor="url" className="font-mono text-xs uppercase font-bold">Target URL</Label>
                      <div className="relative group">
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="rounded-none border-neutral-300 dark:border-neutral-700 h-14 font-mono pl-4 focus:ring-0 focus:border-black dark:focus:border-white transition-colors bg-transparent"
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 bg-black dark:bg-white w-0 group-focus-within:w-full transition-all duration-300" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="border border-dashed border-neutral-300 dark:border-neutral-700 p-1 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer group">
                      <FileUpload onFileChange={setFile} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Configuration Matrix */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <h3 className="font-bold text-lg uppercase tracking-widest">Configuration Matrix</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <div className="space-y-4 group">
                      <div className="flex justify-between items-end">
                        <Label className="font-mono text-xs uppercase font-bold group-hover:text-black dark:group-hover:text-white transition-colors">Clip Duration</Label>
                        <span className="font-mono text-xl font-bold">{clipLength}s</span>
                      </div>
                      <Slider
                        value={clipLength}
                        onValueChange={setClipLength}
                        max={180}
                        min={15}
                        step={15}
                        className="w-full py-4"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400 uppercase">
                        <span>15s</span>
                        <span>180s</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-mono text-xs uppercase font-bold">Timeframe (Optional)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <Input
                            placeholder="00:00"
                            value={timeframeStart}
                            onChange={(e) => setTimeframeStart(e.target.value)}
                            className="rounded-none font-mono text-center h-12 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white bg-transparent"
                          />
                          <div className="absolute bottom-0 left-0 h-0.5 bg-black dark:bg-white w-0 group-focus-within:w-full transition-all duration-300" />
                        </div>
                        <div className="relative group">
                          <Input
                            placeholder="00:00"
                            value={timeframeEnd}
                            onChange={(e) => setTimeframeEnd(e.target.value)}
                            className="rounded-none font-mono text-center h-12 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white bg-transparent"
                          />
                          <div className="absolute bottom-0 left-0 h-0.5 bg-black dark:bg-white w-0 group-focus-within:w-full transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 p-6 hover:border-black dark:hover:border-white transition-colors duration-300 group cursor-pointer" onClick={() => setEnableCaptions(!enableCaptions)}>
                      <div className="space-y-1">
                        <Label htmlFor="captions" className="font-bold uppercase tracking-wider cursor-pointer group-hover:text-black dark:group-hover:text-white transition-colors">Neural Captions</Label>
                        <p className="text-xs text-neutral-500 font-mono">AI-generated subtitles</p>
                      </div>
                      <Switch
                        id="captions"
                        checked={enableCaptions}
                        onCheckedChange={setEnableCaptions}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caption-style" className="font-mono text-xs uppercase font-bold">Caption Style</Label>
                      <Select
                        value={captionStyle}
                        onValueChange={setCaptionStyle}
                      >
                        <SelectTrigger id="caption-style" className="w-full rounded-none border-neutral-300 dark:border-neutral-700 h-12 focus:ring-0 focus:border-black dark:focus:border-white bg-transparent">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-neutral-200 dark:border-neutral-800">
                          <SelectItem value="default">Standard</SelectItem>
                          <SelectItem value="highlight">Highlight</SelectItem>
                          <SelectItem value="karaoke">Karaoke</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-16 text-lg font-bold uppercase tracking-widest rounded-none bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all relative overflow-hidden group cursor-pointer"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-3 h-5 w-5 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>
                        Processing...
                      </span>
                    ) : (
                      <>
                        Initiate Sequence <Zap className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  )}
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
