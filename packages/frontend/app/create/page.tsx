// packages/frontend/app/create.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GridBackground, ContentBox } from "@/components/ui/grid-background";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Upload } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-background">
      <Header />
      <GridBackground pattern="dots" className="relative">
        <div className="relative pt-24 pb-32">
          <div className="max-w-4xl mx-auto px-6">
            <ContentBox variant="premium" className="glass-effect">
              {/* Title */}
              <div className="text-center space-y-3 mb-8">
                <h2 className="text-2xl font-bold gradient-text">Create Your Project</h2>
                <p className="text-muted-foreground">
                  Upload your content and let our AI transform it into multiple formats
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 glass-effect p-1 rounded-xl border border-border">
                    <TabsTrigger value="url" className="rounded-lg data-[state=active]:bg-background">
                      <Upload className="w-4 h-4 mr-2" />
                      YouTube URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-background">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  {/* URL Tab */}
                  <TabsContent value="url" className="space-y-6 mt-8">
                    <ContentBox className="glass-effect border border-border/60">
                      <div className="space-y-3">
                        <Label htmlFor="url">YouTube URL</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                    </ContentBox>
                  </TabsContent>

                  {/* Upload Tab */}
                  <TabsContent value="upload" className="space-y-6 mt-8">
                    <ContentBox className="glass-effect border border-border/60">
                      <FileUpload onFileChange={setFile} />
                    </ContentBox>
                  </TabsContent>
                </Tabs>

                {/* Advanced Options */}
                <ContentBox className="glass-effect border border-border/40">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold gradient-text">Generation Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div>
                        <Label>Max Clip Length: {clipLength[0]} seconds</Label>
                        <Slider value={clipLength} onValueChange={setClipLength} max={180} min={15} step={15} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="captions">Stylized Captions</Label>
                        <Switch id="captions" checked={enableCaptions} onCheckedChange={setEnableCaptions} />
                      </div>
                      <div>
                        <Label htmlFor="caption-style">Caption Style</Label>
                        <Select value={captionStyle} onValueChange={setCaptionStyle}>
                          <SelectTrigger id="caption-style">
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Standard</SelectItem>
                            <SelectItem value="highlight">Highlight</SelectItem>
                            <SelectItem value="karaoke">Karaoke</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-time">Start Time (Optional)</Label>
                        <Input id="start-time" value={timeframeStart} onChange={(e) => setTimeframeStart(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time (Optional)</Label>
                        <Input id="end-time" value={timeframeEnd} onChange={(e) => setTimeframeEnd(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </ContentBox>

                {/* Submit */}
                <Button type="submit" size="lg" disabled={isLoading} className="w-full h-14 text-lg font-semibold">
                  {isLoading ? "Creating Magic..." : "Transform Content"}
                </Button>
              </form>
            </ContentBox>
          </div>
        </div>
      </GridBackground>
      <Footer />
    </div>
  );
}
