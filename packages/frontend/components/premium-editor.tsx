// packages/frontend/components/premium-editor.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Award, 
  Smile, 
  Bold, 
  Italic, 
  Heading2, 
  Quote, 
  Code, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Undo2,
  Redo2,
  Wand2,
  Upload,
  Eye,
  PenTool,
  RefreshCw,
  HelpCircle,
  Key,
  Sliders,
  Copy
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PremiumEditorProps {
  contentId: string;
  contentType: "article" | "linkedin" | "twitter" | "summary";
  initialTitle?: string;
  initialHeroImagePrompt?: string;
  initialBody: string | string[];
  tokenProvider: () => Promise<string | null>;
  onSaved?: (updatedContent: any) => void;
}

// ----------------- Virtualization Helpers -----------------
// Virtualizes raw markdown (containing heavy base64 strings) into lightweight tokens
const virtualizeMarkdown = (markdown: string, existingMap: Record<string, string>) => {
  let cleanText = markdown;
  const regex = /!\[.*?\]\((data:image\/.*?;base64,.*?)\)/g;
  let match;
  
  const newMap = { ...existingMap };
  const matches: Array<{ full: string; base64: string }> = [];
  
  regex.lastIndex = 0;
  while ((match = regex.exec(markdown)) !== null) {
    matches.push({
      full: match[0],
      base64: match[1]
    });
  }

  matches.forEach((item, index) => {
    // Generate a stable key based on index
    const tokenKey = `dev_img_${index}`;
    newMap[tokenKey] = item.base64;
    cleanText = cleanText.replace(item.full, `[UploadedImage: ${tokenKey}]`);
  });

  return { cleanText, newMap };
};

// De-virtualizes lightweight tokens back into heavy raw base64 markdown for cloud persistence
const devirtualizeMarkdown = (text: string, map: Record<string, string>) => {
  let rawMarkdown = text;
  const regex = /\[UploadedImage: (dev_img_.*?)\]/g;
  let match;

  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const tokenKey = match[1];
    const base64Data = map[tokenKey];
    if (base64Data) {
      rawMarkdown = rawMarkdown.replace(match[0], `![Uploaded Image](${base64Data})`);
    }
  }

  return rawMarkdown;
};

// ----------------- Auto-resizing Textarea -----------------
interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSelectionChange?: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ value, onChange, placeholder, className, onSelectionChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const combinedRef = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const adjustHeight = useCallback(() => {
      const textarea = internalRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, []);

    useEffect(() => {
      adjustHeight();
      window.addEventListener("resize", adjustHeight);
      return () => window.removeEventListener("resize", adjustHeight);
    }, [value, adjustHeight]);

    return (
      <textarea
        ref={combinedRef}
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e);
          adjustHeight();
        }}
        onSelect={onSelectionChange}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none overflow-hidden focus:outline-none focus:ring-0 bg-transparent p-0 border-none select-text",
          className
        )}
        rows={1}
        {...props}
      />
    );
  }
);
AutoResizeTextarea.displayName = "AutoResizeTextarea";

export function PremiumEditor({
  contentId,
  contentType,
  initialTitle = "",
  initialHeroImagePrompt = "",
  initialBody,
  tokenProvider,
  onSaved,
}: PremiumEditorProps) {
  // State variables
  const [title, setTitle] = useState(initialTitle);
  const [heroImagePrompt, setHeroImagePrompt] = useState(initialHeroImagePrompt);
  const [bodyText, setBodyText] = useState("");
  const [tweets, setTweets] = useState<string[]>(
    Array.isArray(initialBody) ? initialBody : []
  );

  const [savingState, setSavingState] = useState<"idle" | "drafting" | "saving" | "saved" | "error">("idle");
  const [activeTextareaIndex, setActiveTextareaIndex] = useState<number | null>(contentType === "twitter" ? 0 : -1);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  
  // Custom interactive uploader
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Virtualized base64 memory map
  const [uploadedImagesMap, setUploadedImagesMap] = useState<Record<string, string>>({});

  // Image loading and error tracking
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [retrySeeds, setRetrySeeds] = useState<Record<string, number>>({});

  // Undo/Redo State stack
  const [history, setHistory] = useState<Array<{ title: string; bodyText: string; tweets: string[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Pollinations API settings
  const [pollinationsKey, setPollinationsKey] = useState<string>("");
  const [pollinationsModel, setPollinationsModel] = useState<string>("flux");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // Debounced hero image preview — only update preview URL after user stops typing
  const [debouncedHeroPreviewPrompt, setDebouncedHeroPreviewPrompt] = useState(initialHeroImagePrompt);
  const heroPreviewTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (heroPreviewTimerRef.current) clearTimeout(heroPreviewTimerRef.current);
    heroPreviewTimerRef.current = setTimeout(() => {
      setDebouncedHeroPreviewPrompt(heroImagePrompt);
    }, 2000);
    return () => {
      if (heroPreviewTimerRef.current) clearTimeout(heroPreviewTimerRef.current);
    };
  }, [heroImagePrompt]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPollinationsKey(localStorage.getItem("omnicontent_pollinations_key") || "");
      setPollinationsModel(localStorage.getItem("omnicontent_pollinations_model") || "flux");
    }
  }, []);

  // Load history stack from sessionStorage on mount/switch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionHistoryKey = `editor_history_${contentId}_${contentType}`;
      const sessionHistoryIndexKey = `editor_history_index_${contentId}_${contentType}`;
      
      const savedHistory = sessionStorage.getItem(sessionHistoryKey);
      const savedIndex = sessionStorage.getItem(sessionHistoryIndexKey);
      
      if (savedHistory && savedIndex) {
        try {
          const parsed = JSON.parse(savedHistory);
          const index = parseInt(savedIndex, 10);
          if (Array.isArray(parsed) && parsed.length > 0 && index >= 0 && index < parsed.length) {
            // Update refs to reflect initial load so the parent SWR sync hook is bypassed
            lastLoadedInitialBody.current = initialBody;
            lastLoadedInitialTitle.current = initialTitle;

            setHistory(parsed);
            historyRef.current = parsed;
            setHistoryIndex(index);
            
            // Sync local states to match the loaded history checkpoint
            const currentState = parsed[index];
            if (currentState) {
              setTitle(currentState.title);
              setBodyText(currentState.bodyText);
              setTweets(currentState.tweets);
            }
            return;
          }
        } catch (e) {
          console.error("Failed to load history from sessionStorage", e);
        }
      }
      
      // Seed history index to -1 if no session cache exists (allowing standard sync hook to run)
      setHistory([]);
      historyRef.current = [];
      setHistoryIndex(-1);
    }
  }, [contentId, contentType, initialBody, initialTitle]);

  // Save history stack to sessionStorage on changes
  useEffect(() => {
    if (typeof window !== "undefined" && history.length > 0) {
      const sessionHistoryKey = `editor_history_${contentId}_${contentType}`;
      const sessionHistoryIndexKey = `editor_history_index_${contentId}_${contentType}`;
      
      sessionStorage.setItem(sessionHistoryKey, JSON.stringify(history));
      sessionStorage.setItem(sessionHistoryIndexKey, historyIndex.toString());
    }
  }, [history, historyIndex, contentId, contentType]);

  // References to textareas to inject formatting
  const articleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const linkedinTextareaRef = useRef<HTMLTextAreaElement>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tweetTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Refs for tracking local states without triggering useEffect dependencies
  const lastLoadedInitialBody = useRef<string | string[] | null>(null);
  const lastLoadedInitialTitle = useRef<string | null>(null);
  const lastLoadedInitialHeroImagePrompt = useRef<string | null>(null);
  const bodyTextRef = useRef(bodyText);
  const uploadedImagesMapRef = useRef(uploadedImagesMap);
  const historyRef = useRef(history);
  const tweetsRef = useRef(tweets);
  const heroImagePromptRef = useRef(heroImagePrompt);
  const lastCursorPos = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const triggerDebouncedSaveRef = useRef<(title: string, body: string | string[], skip?: boolean) => void>(() => {});

  useEffect(() => {
    bodyTextRef.current = bodyText;
  }, [bodyText]);

  useEffect(() => {
    uploadedImagesMapRef.current = uploadedImagesMap;
  }, [uploadedImagesMap]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    tweetsRef.current = tweets;
  }, [tweets]);

  useEffect(() => {
    heroImagePromptRef.current = heroImagePrompt;
  }, [heroImagePrompt]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Sync state if initial value changes from parent (e.g. SWR fetch or translation)
  useEffect(() => {
    const initialBodyChanged = JSON.stringify(initialBody) !== JSON.stringify(lastLoadedInitialBody.current);
    const initialTitleChanged = initialTitle !== lastLoadedInitialTitle.current;
    const initialHeroImagePromptChanged = initialHeroImagePrompt !== lastLoadedInitialHeroImagePrompt.current;

    if (initialBodyChanged || initialTitleChanged || initialHeroImagePromptChanged) {
      lastLoadedInitialBody.current = initialBody;
      lastLoadedInitialTitle.current = initialTitle;
      lastLoadedInitialHeroImagePrompt.current = initialHeroImagePrompt;

      if (typeof initialBody === "string") {
        // Avoid virtualizing if it matches the current local de-virtualized text to prevent cursor resetting
        const currentRawText = devirtualizeMarkdown(bodyTextRef.current, uploadedImagesMapRef.current);
        if (currentRawText !== initialBody || bodyTextRef.current === "") {
          const { cleanText, newMap } = virtualizeMarkdown(initialBody, uploadedImagesMapRef.current);
          setBodyText(cleanText);
          bodyTextRef.current = cleanText;
          setUploadedImagesMap(newMap);
          uploadedImagesMapRef.current = newMap;

          // Seed history checkpoint
          if (historyRef.current.length === 0) {
            const seedHistory = [{ title: initialTitle, bodyText: cleanText, tweets: [] }];
            setHistory(seedHistory);
            historyRef.current = seedHistory;
            setHistoryIndex(0);
          }
        }
      } else if (Array.isArray(initialBody)) {
        setTweets(initialBody);
        tweetsRef.current = initialBody;

        // Seed history checkpoint
        if (historyRef.current.length === 0) {
          const seedHistory = [{ title: initialTitle, bodyText: "", tweets: initialBody }];
          setHistory(seedHistory);
          historyRef.current = seedHistory;
          setHistoryIndex(0);
        }
      }

      if (initialTitleChanged && initialTitle) {
        setTitle(initialTitle);
      }
      if (initialHeroImagePromptChanged && initialHeroImagePrompt !== undefined) {
        setHeroImagePrompt(initialHeroImagePrompt);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBody, initialTitle, initialHeroImagePrompt]);

  // Push history checkpoint
  const pushToHistory = useCallback((nextState: { title: string; bodyText: string; tweets: string[] }) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setHistory((prev) => {
      const cleanHistory = prev.slice(0, historyIndex + 1);
      const lastState = cleanHistory[cleanHistory.length - 1];
      if (
        lastState &&
        lastState.title === nextState.title &&
        lastState.bodyText === nextState.bodyText &&
        JSON.stringify(lastState.tweets) === JSON.stringify(nextState.tweets)
      ) {
        return prev;
      }

      const updatedHistory = [...cleanHistory, nextState];
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [historyIndex]);

  // Undo / Redo Operations
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      isUndoRedoAction.current = true;
      setHistoryIndex(prevIndex);
      
      setTitle(prevState.title);
      setBodyText(prevState.bodyText);
      setTweets(prevState.tweets);
      
      const payloadBody = contentType === "twitter" ? prevState.tweets : prevState.bodyText;
      triggerDebouncedSaveRef.current(prevState.title, payloadBody, true);
      toast.info("Undo", { duration: 1000 });
    }
  }, [historyIndex, history, contentType]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      isUndoRedoAction.current = true;
      setHistoryIndex(nextIndex);
      
      setTitle(nextState.title);
      setBodyText(nextState.bodyText);
      setTweets(nextState.tweets);
      
      const payloadBody = contentType === "twitter" ? nextState.tweets : nextState.bodyText;
      triggerDebouncedSaveRef.current(nextState.title, payloadBody, true);
      toast.info("Redo", { duration: 1000 });
    }
  }, [historyIndex, history, contentType]);

  const handleRevertToOriginal = async () => {
    if (!window.confirm("Are you sure you want to revert this content to the original generation? Any edits you made will be replaced by the original draft.")) {
      return;
    }
    
    try {
      setIsReverting(true);
      const token = await tokenProvider();
      if (!token) {
        throw new Error("No authorization token");
      }

      let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        apiUrl = "http://localhost:8080";
      }

      const res = await fetch(`${apiUrl}/api/v1/content/${contentId}/revert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Revert rejected with status: ${res.status}`);
      }

      const updatedContent = await res.json();
      toast.success("Successfully reverted to original draft!");

      // 1. Clear session history checkpoints to prevent showing stale edits on undo
      const sessionHistoryKey = `editor_history_${contentId}_${contentType}`;
      const sessionHistoryIndexKey = `editor_history_index_${contentId}_${contentType}`;
      sessionStorage.removeItem(sessionHistoryKey);
      sessionStorage.removeItem(sessionHistoryIndexKey);

      // 2. Refresh local state
      if (contentType === "article") {
        setTitle(updatedContent.generatedTitle || "Untitled Draft");
        setBodyText(updatedContent.generatedContent || "");
        
        // Push fresh history seed
        const cleanText = updatedContent.generatedContent || "";
        const seedHistory = [{ title: updatedContent.generatedTitle || "Untitled Draft", bodyText: cleanText, tweets: [] }];
        setHistory(seedHistory);
        setHistoryIndex(0);
      } else if (contentType === "linkedin") {
        setBodyText(updatedContent.linkedinPost || "");
        
        const seedHistory = [{ title: "", bodyText: updatedContent.linkedinPost || "", tweets: [] }];
        setHistory(seedHistory);
        setHistoryIndex(0);
      } else if (contentType === "summary") {
        setBodyText(updatedContent.summary || "");
        
        const seedHistory = [{ title: "", bodyText: updatedContent.summary || "", tweets: [] }];
        setHistory(seedHistory);
        setHistoryIndex(0);
      } else if (contentType === "twitter") {
        const tweetsArray = updatedContent.twitterThread || [];
        setTweets(tweetsArray);
        
        const seedHistory = [{ title: "", bodyText: "", tweets: tweetsArray }];
        setHistory(seedHistory);
        setHistoryIndex(0);
      }

      // 3. Trigger parent refresh/SWR mutation
      if (onSaved) onSaved(updatedContent);

    } catch (err: any) {
      console.error("[Revert Error]:", err);
      toast.error(err.message || "Failed to revert to original draft.");
    } finally {
      setIsReverting(false);
    }
  };

  // Listen for Ctrl+Z / Ctrl+Y keyboard hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          handleUndo();
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Unified save function
  const saveToCloud = useCallback(
    async (latestTitle: string, latestBody: string | string[]) => {
      try {
        setSavingState("saving");
        const token = await tokenProvider();
        if (!token) {
          throw new Error("No authorization token");
        }

        // De-virtualize base64 strings so they are saved correctly in MongoDB
        const deVirtualizedBody = typeof latestBody === "string" 
          ? devirtualizeMarkdown(latestBody, uploadedImagesMap)
          : latestBody;

        const bodyPayload: any = {};
        if (contentType === "article") {
          bodyPayload.generatedTitle = latestTitle;
          bodyPayload.generatedContent = deVirtualizedBody;
          bodyPayload.heroImagePrompt = heroImagePromptRef.current;
        } else if (contentType === "linkedin") {
          bodyPayload.linkedinPost = deVirtualizedBody;
        } else if (contentType === "twitter") {
          bodyPayload.twitterThread = deVirtualizedBody;
        } else if (contentType === "summary") {
          bodyPayload.summary = deVirtualizedBody;
        }

        let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
          apiUrl = "http://localhost:8080";
        }
        const res = await fetch(`${apiUrl}/api/v1/content/${contentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          throw new Error(`Cloud save rejected with status: ${res.status}`);
        }

        const updatedData = await res.json();
        if (isMounted.current) {
          setSavingState("saved");
          if (onSaved) onSaved(updatedData);
        }
      } catch (err) {
        console.error("[Cloud Save Error]:", err);
        if (isMounted.current) {
          setSavingState("error");
          toast.error("Failed to auto-save draft to the cloud.");
        }
      }
    },
    [contentId, contentType, tokenProvider, onSaved, uploadedImagesMap]
  );

  // Debounced cloud save trigger
  const triggerDebouncedSave = useCallback(
    (newTitle: string, newBody: string | string[], skipHistoryPush: boolean = false) => {
      setSavingState("drafting");
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        if (!skipHistoryPush) {
          const tState = typeof newBody === "string" ? newBody : "";
          const twState = Array.isArray(newBody) ? newBody : [];
          pushToHistory({ title: newTitle, bodyText: tState, tweets: twState });
        }
        saveToCloud(newTitle, newBody);
      }, 1500); 
    },
    [saveToCloud, pushToHistory]
  );

  // Keep the ref in sync so handleUndo/handleRedo never use a stale version
  useEffect(() => {
    triggerDebouncedSaveRef.current = triggerDebouncedSave;
  }, [triggerDebouncedSave]);

  // Handlers for input modifications
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerDebouncedSave(val, bodyText);
  };

  const handleHeroImagePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHeroImagePrompt(val);
    triggerDebouncedSave(title, bodyText, true);
  };

  const handleBodyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    lastCursorPos.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
    setBodyText(val);
    triggerDebouncedSave(title, val);
  };

  const handleTweetTextChange = (index: number, val: string) => {
    const newTweets = [...tweets];
    newTweets[index] = val;
    setTweets(newTweets);
    triggerDebouncedSave(title, newTweets);
  };

  // Tweet Thread Operations
  const handleAddTweet = (index: number) => {
    const newTweets = [...tweets];
    newTweets.splice(index + 1, 0, "");
    setTweets(newTweets);
    setActiveTextareaIndex(index + 1);
    triggerDebouncedSave(title, newTweets);
    toast.success("Added new tweet to thread");
  };

  const handleDeleteTweet = (index: number) => {
    if (tweets.length <= 1) {
      toast.warning("Threads must have at least one tweet.");
      return;
    }
    const newTweets = [...tweets];
    newTweets.splice(index, 1);
    setTweets(newTweets);
    
    const nextFocus = Math.max(0, index - 1);
    setActiveTextareaIndex(nextFocus);
    triggerDebouncedSave(title, newTweets);
    toast.success("Deleted tweet from thread");
  };

  // Selection monitoring for formatting
  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const range = {
      start: el.selectionStart,
      end: el.selectionEnd,
    };
    setSelectionRange(range);
    lastCursorPos.current = range;
  };

  // Inject Markdown formatting at cursor
  const applyFormatting = (format: "bold" | "italic" | "heading" | "quote" | "code" | "image" | "emoji", valOverride?: string) => {
    let activeEl: HTMLTextAreaElement | null = null;

    if (contentType === "article") {
      activeEl = articleTextareaRef.current;
    } else if (contentType === "linkedin") {
      activeEl = linkedinTextareaRef.current;
    } else if (contentType === "summary") {
      activeEl = summaryTextareaRef.current;
    } else if (contentType === "twitter" && activeTextareaIndex !== null) {
      activeEl = tweetTextareaRefs.current[activeTextareaIndex];
    }

    if (!activeEl) {
      toast.info("Please click on a text area first to position your cursor.");
      return;
    }

    const text = activeEl.value;
    const start = lastCursorPos.current.start ?? activeEl.selectionStart;
    const end = lastCursorPos.current.end ?? activeEl.selectionEnd;
    const selectedText = text.substring(start, end);

    let prefix = "";
    let suffix = "";
    let insertedText = selectedText;

    switch (format) {
      case "bold":
        prefix = "**";
        suffix = "**";
        if (!selectedText) insertedText = "bold text";
        break;
      case "italic":
        prefix = "*";
        suffix = "*";
        if (!selectedText) insertedText = "italicized text";
        break;
      case "heading":
        prefix = "\n\n## ";
        suffix = "\n";
        if (!selectedText) insertedText = "Heading Level 2";
        break;
      case "quote":
        prefix = "\n\n> ";
        suffix = "\n";
        if (!selectedText) insertedText = "Blockquote pullout";
        break;
      case "code":
        prefix = "`";
        suffix = "`";
        if (!selectedText) insertedText = "code";
        break;
      case "image":
        prefix = "\n\n[Image: ";
        suffix = "]\n\n";
        if (!selectedText) insertedText = valOverride || "A breathtaking abstract visual representing workflow efficiency";
        break;
      case "emoji":
        prefix = valOverride ?? "";
        suffix = "";
        insertedText = "";
        break;
    }

    const replacement = prefix + insertedText + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    if (contentType === "twitter" && activeTextareaIndex !== null) {
      handleTweetTextChange(activeTextareaIndex, newText);
    } else {
      setBodyText(newText);
      triggerDebouncedSave(title, newText);
    }

    setTimeout(() => {
      if (activeEl) {
        activeEl.focus();
        const nextCursorPos = start + prefix.length + insertedText.length + suffix.length;
        activeEl.setSelectionRange(nextCursorPos, nextCursorPos);
        lastCursorPos.current = { start: nextCursorPos, end: nextCursorPos };
      }
    }, 50);
  };

  // Local Device Uploader helper
  const triggerDeviceUpload = () => {
    setIsImageMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload valid image files only.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Max file size limit is 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      
      // Assign a stable key in the memory map
      const matchIndex = Object.keys(uploadedImagesMap).length;
      const tokenKey = `dev_img_${matchIndex}_${Date.now()}`;
      
      setUploadedImagesMap(prev => ({
        ...prev,
        [tokenKey]: base64Url
      }));

      // Insert clean short token instead of heavy Base64 inside the textarea!
      const cleanToken = `[UploadedImage: ${tokenKey}]`;
      applyFormatting("emoji", `\n\n${cleanToken}\n\n`);
      toast.success("Image uploaded from local device successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Real-time parser for virtualized content inside bodyText
  const parseArticleImages = (text: string) => {
    const list: Array<{ id: string; type: "ai" | "device"; promptOrUrl: string; matchText: string }> = [];
    
    // 1. Parse AI image prompts: [Image: prompt]
    const aiRegex = /\[Image: (.*?)\]/g;
    let aiMatch;
    while ((aiMatch = aiRegex.exec(text)) !== null) {
      list.push({
        id: `ai-${aiMatch.index}`,
        type: "ai",
        promptOrUrl: aiMatch[1],
        matchText: aiMatch[0]
      });
    }

    // 2. Parse Virtualized Local image prompts: [UploadedImage: tokenKey]
    const uploadRegex = /\[UploadedImage: (dev_img_.*?)\]/g;
    let uploadMatch;
    while ((uploadMatch = uploadRegex.exec(text)) !== null) {
      const tokenKey = uploadMatch[1];
      const base64Data = uploadedImagesMap[tokenKey];
      if (base64Data) {
        list.push({
          id: `dev-${uploadMatch.index}-${tokenKey}`,
          type: "device",
          promptOrUrl: base64Data,
          matchText: uploadMatch[0]
        });
      }
    }

    return list;
  };

  const handleUpdateAiPrompt = (matchText: string, oldPrompt: string, newPrompt: string) => {
    const oldSyntax = matchText;
    const newSyntax = `[Image: ${newPrompt}]`;
    const newText = bodyText.replace(oldSyntax, newSyntax);
    setBodyText(newText);
    triggerDebouncedSave(title, newText);
  };

  const handleRemoveVisual = (matchText: string) => {
    const newText = bodyText.replace(matchText, "");
    setBodyText(newText);
    triggerDebouncedSave(title, newText);
    toast.success("Visual removed from article.");
  };

  // Twitter thread helper character limits
  const renderTwitterCircle = (text: string) => {
    const limit = 280;
    const count = text.length;
    const percentage = Math.min(100, (count / limit) * 100);
    const remaining = limit - count;
    
    const r = 13;
    const strokeWidth = 2.5;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ - (percentage / 100) * circ;

    let colorClass = "stroke-[var(--accent-500)] text-[var(--accent-500)]";
    if (remaining <= 20 && remaining > 0) {
      colorClass = "stroke-amber-500 text-amber-500";
    } else if (remaining <= 0) {
      colorClass = "stroke-red-500 text-red-500";
    }

    return (
      <div className="flex items-center space-x-2 flex-shrink-0 select-none">
        {remaining <= 20 && (
          <span className={cn("text-xs font-semibold font-mono", remaining < 0 ? "text-red-500" : "text-amber-500")}>
            {remaining}
          </span>
        )}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r={r}
              className="stroke-muted dark:stroke-white/[0.08]"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r={r}
              className={cn("transition-all duration-300", colorClass)}
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
      </div>
    );
  };

  const commonEmojis = ["✨", "🔥", "🚀", "🧵", "🤖", "📝", "💡", "📈", "👇"];
  const parsedVisuals = contentType === "article" ? parseArticleImages(bodyText) : [];

  return (
    <div className="flex flex-col h-full w-full select-text border border-border/80 rounded-2xl bg-card overflow-hidden shadow-sm">
      
      {/* ----------------- Top Save State Banner ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/20 select-none">
        <div className="flex items-center space-x-2.5">
          <Badge className="bg-muted border border-border text-foreground hover:bg-muted font-medium px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
            <Award className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Document Workspace</span>
          </Badge>
          <span className="hidden sm:inline-block text-[11.5px] text-muted-foreground">• Draft updates auto-save locally</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          {savingState === "idle" && (
            <span className="text-muted-foreground/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              Draft ready
            </span>
          )}
          {savingState === "drafting" && (
            <span className="text-muted-foreground flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Typing...
            </span>
          )}
          {savingState === "saving" && (
            <span className="text-muted-foreground flex items-center gap-1 animate-pulse font-sans">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-500)]" />
              Saving drafts...
            </span>
          )}
          {savingState === "saved" && (
            <span className="text-emerald-500 font-semibold flex items-center gap-1 animate-in fade-in duration-300 font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Changes saved
            </span>
          )}
          {savingState === "error" && (
            <span className="text-red-500 font-semibold flex items-center gap-1 animate-shake font-sans">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              Save error
            </span>
          )}
        </div>
      </div>

      {/* ----------------- Toolbar ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 border-b border-border bg-muted/10 select-none">
        
        {/* Formatting, Undo/Redo & Images */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-40"
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <span className="h-4 w-px bg-border mx-1" />

          {/* Bold, Italic */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Bold"
            onClick={() => applyFormatting("bold")}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Italic"
            onClick={() => applyFormatting("italic")}
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          {contentType === "article" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Heading 2"
                onClick={() => applyFormatting("heading")}
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Blockquote"
                onClick={() => applyFormatting("quote")}
              >
                <Quote className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Code Inline"
            onClick={() => applyFormatting("code")}
          >
            <Code className="w-4 h-4" />
          </Button>

          {/* Interactive Image Manager Drop-Menu */}
          {contentType === "article" && (
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "w-8 h-8 rounded-md text-muted-foreground hover:text-foreground",
                  isImageMenuOpen ? "bg-muted text-foreground" : "hover:bg-muted"
                )}
                title="Insert Image"
                onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              
              {isImageMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-40 bg-card border border-border shadow-xl rounded-xl p-2 w-[220px] animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImageMenuOpen(false);
                      applyFormatting("image", "A cinematic, ultra-detailed abstract scene representing productivity and ideas");
                      toast.success("Image prompt placeholder inserted!");
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs hover:bg-muted transition-colors font-medium text-foreground"
                  >
                    <Sliders className="w-4 h-4 text-muted-foreground" />
                    <span>Insert Image Prompt</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={triggerDeviceUpload}
                    className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs hover:bg-muted transition-colors font-medium text-foreground"
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span>Upload Local Asset</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hidden local image input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleDeviceImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Right Group: Emojis, Settings, Revert Action */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Emojis list */}
          <div className="flex items-center space-x-1.5 border-l border-border pl-2 sm:pl-3">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="w-7 h-7 flex items-center justify-center text-sm rounded-md hover:bg-muted transition-colors active:scale-95"
                onClick={() => applyFormatting("emoji", emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* AI Image Generation settings */}
          {contentType === "article" && (
            <div className="relative border-l border-border pl-2 sm:pl-3 flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "w-8 h-8 rounded-md text-muted-foreground hover:text-foreground relative hover:bg-muted",
                  isSettingsOpen && "bg-muted text-foreground"
                )}
                title="Image Generation Settings"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Sliders className="w-4 h-4" />
                {pollinationsKey && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-neutral-400 dark:bg-zinc-500 rounded-full border border-card shadow-sm" />
                )}
              </Button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 w-[280px] animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-foreground">
                      Visual Assets Config
                    </h4>
                    <p className="text-[9.5px] text-muted-foreground leading-normal font-sans">
                      Configure your Pollinations integration for high-speed, stable image loading.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] uppercase font-bold tracking-wider text-muted-foreground block font-sans">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={pollinationsKey}
                      onChange={(e) => setPollinationsKey(e.target.value)}
                      placeholder="sk_..."
                      className="w-full bg-muted border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/45 font-sans"
                    />
                    <a
                      href="https://enter.pollinations.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-foreground font-medium inline-block underline font-sans"
                    >
                      Create a free key at enter.pollinations.ai &rarr;
                    </a>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] uppercase font-bold tracking-wider text-muted-foreground block font-sans">
                      Image Model
                    </label>
                    <select
                      value={pollinationsModel}
                      onChange={(e) => setPollinationsModel(e.target.value)}
                      className="w-full bg-muted border border-border/80 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground/30 transition-colors font-sans"
                    >
                      <option value="flux">Flux Schnell (High Quality)</option>
                      <option value="gptimage">GPT Image Mini (High Speed)</option>
                      <option value="wan-image">Wan 2.7 Image (Alibaba)</option>
                      <option value="klein">Flux 2 Klein (Fast Detail)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem("omnicontent_pollinations_key", pollinationsKey.trim());
                        localStorage.setItem("omnicontent_pollinations_model", pollinationsModel);
                        setIsSettingsOpen(false);
                        toast.success("Visuals configuration saved!");
                      }}
                      className="flex-1 px-3 py-2 bg-foreground hover:bg-foreground/90 text-background rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all text-center"
                    >
                      Save Config
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPollinationsKey("");
                        localStorage.removeItem("omnicontent_pollinations_key");
                        setIsSettingsOpen(false);
                        toast.info("Config cleared.");
                      }}
                      className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700 active:scale-95 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Revert Action */}
          <div className="border-l border-border pl-2 sm:pl-3 flex items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevertToOriginal}
              disabled={isReverting}
              className="h-8 rounded-lg border-border hover:border-foreground/30 hover:bg-accent text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 shadow-sm bg-background active:scale-95 transition-all select-none"
              title="Revert to original generated draft (Accident Recovery)"
            >
              {isReverting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isReverting ? "Restoring..." : "Revert Draft"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ----------------- Active Workspace Body ----------------- */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-card max-h-[850px] space-y-8">
        
        {/* ARTICLE TYPE */}
        {contentType === "article" && (
          <div className="max-w-[720px] mx-auto select-text space-y-6">
            {/* Inline Title input */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Give your article a premium title..."
              className="w-full bg-transparent p-0 border-none font-sans font-bold text-3xl md:text-4xl tracking-tight text-foreground leading-tight focus:outline-none focus:ring-0 mb-3 placeholder-muted-foreground/60 select-text"
            />

            {/* Custom Hero Image Prompt input */}
            <div className="flex flex-col gap-2 p-3 bg-muted/20 hover:bg-muted/30 border border-border/40 rounded-xl transition-all duration-200">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground select-none flex items-center gap-1.5 font-sans">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Customize Article Hero Image Visual Prompt</span>
              </label>
              <input
                type="text"
                value={heroImagePrompt}
                onChange={handleHeroImagePromptChange}
                placeholder="Describe a cinematic scene for the hero image (avoid text words to prevent spelling errors!)..."
                className="w-full bg-transparent p-0 border-none text-xs text-foreground focus:outline-none focus:ring-0 placeholder-muted-foreground/60 select-text"
              />

              {/* Live Hero Image Preview */}
              {debouncedHeroPreviewPrompt.trim() && (
                <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-lg border border-border/30 bg-muted/10 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={debouncedHeroPreviewPrompt.trim()}
                    src={(() => {
                      const defaultKey = process.env.NEXT_PUBLIC_POLLINATIONS_DEFAULT_KEY || "";
                      const defaultReferrer = process.env.NEXT_PUBLIC_POLLINATIONS_REFERRER || "omnicontent-ai.com";
                      const keyToUse = pollinationsKey ? pollinationsKey.trim() : defaultKey;
                      const prompt = debouncedHeroPreviewPrompt.trim();
                      return keyToUse
                        ? `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=1280&height=720&model=${encodeURIComponent(pollinationsModel)}&key=${encodeURIComponent(keyToUse)}&referrer=${encodeURIComponent(defaultReferrer)}`
                        : `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=${encodeURIComponent(pollinationsModel)}&referrer=${encodeURIComponent(defaultReferrer)}`;
                    })()}
                    alt="Hero Image Preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[9px] text-muted-foreground font-mono border border-border/30">
                    LIVE PREVIEW
                  </div>
                </div>
              )}
            </div>
            <div className="border-b border-border/60 pb-3 flex items-center space-x-2 text-xs text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Drafting Article Body · Markdown Allowed</span>
            </div>

            {/* Markdown Text Area */}
            <AutoResizeTextarea
              ref={articleTextareaRef}
              value={bodyText}
              onChange={handleBodyTextChange}
              onSelectionChange={handleSelection}
              placeholder="Start drafting here... Use the toolbar above or raw markdown (**bold**, *italics*, # headers)."
              className="font-serif text-[19px] leading-[30px] text-foreground/85 antialiased min-h-[350px] placeholder-muted-foreground/50 select-text"
              style={{ fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif' }}
            />

            {/* Premium Document Visuals Gallery */}
            {parsedVisuals.length > 0 && (
              <div className="pt-8 border-t border-border/50 select-none space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Document Visuals Gallery ({parsedVisuals.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {parsedVisuals.map((visual) => {
                    const isAI = visual.type === "ai";
                    const isLoaded = loadedImages[visual.id];
                    const isError = imageErrors[visual.id];
                    const seedVal = retrySeeds[visual.id] || 0;
                    const seedParam = seedVal ? `&seed=${seedVal}` : "";
                    
                    // Clean AI prompts by replacing newlines, trimming, and stripping redundant "Image:" prefixes
                    let cleanedPrompt = isAI 
                      ? visual.promptOrUrl.replace(/[\r\n]+/g, ' ').trim() 
                      : "";
                    if (isAI && cleanedPrompt.toLowerCase().startsWith("image:")) {
                      cleanedPrompt = cleanedPrompt.slice(6).trim();
                    }
                      
                    const activeKey = pollinationsKey || process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || "";
                    const activeModel = pollinationsModel || "flux";

                    const imageUrl = isAI
                      ? (activeKey
                          ? `https://gen.pollinations.ai/image/${encodeURIComponent(cleanedPrompt + " cinematic, photorealistic, high quality, digital art, sharp focus")}?width=512&height=512&model=${encodeURIComponent(activeModel)}&key=${encodeURIComponent(activeKey.trim())}${seedVal ? `&seed=${seedVal}` : ""}`
                          : `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanedPrompt + " cinematic, photorealistic, high quality, digital art, sharp focus")}?width=512&height=512&model=${encodeURIComponent(activeModel)}${seedParam}`)
                      : visual.promptOrUrl;

                    return (
                      <div
                        key={visual.id}
                        className="bg-muted/30 border border-border/70 rounded-xl overflow-hidden shadow-sm flex flex-col group/card relative"
                      >
                        <div className="aspect-[5/3] bg-neutral-950 overflow-hidden relative border-b border-border/40 flex items-center justify-center">
                          {/* 1. Loading Overlay */}
                          {!isLoaded && !isError && (
                            <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-4 text-center select-none z-10">
                              <Loader2 className="w-6 h-6 text-foreground/45 animate-spin mb-2" />
                              <span className="text-[11px] font-semibold text-neutral-400 font-sans">
                                {isAI ? "Loading Visual Asset..." : "Loading Asset..."}
                              </span>
                              {isAI && (
                                <span className="text-[9px] text-neutral-500 max-w-[200px] truncate mt-1 font-sans">
                                  {visual.promptOrUrl}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 2. Error Overlay */}
                          {isError && (
                            <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-4 text-center select-none z-20 space-y-2">
                              <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
                              <span className="text-[11.5px] font-semibold text-neutral-300 font-sans">
                                {isAI ? "Failed to generate visual" : "Failed to load image"}
                              </span>
                              {isAI && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageErrors(prev => ({ ...prev, [visual.id]: false }));
                                    setLoadedImages(prev => ({ ...prev, [visual.id]: false }));
                                    setRetrySeeds(prev => ({ ...prev, [visual.id]: (prev[visual.id] || 0) + 1 }));
                                  }}
                                  className="px-3 py-1.5 bg-neutral-800 hover:bg-zinc-700 text-white rounded-lg text-[10.5px] font-semibold transition-colors flex items-center gap-1.5 shadow-md border border-neutral-700 active:scale-95 font-sans"
                                >
                                  <RefreshCw className="w-3 h-3 text-foreground/75 animate-spin" style={{ animationDuration: '3s' }} />
                                  <span>Retry Generation</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* 3. Image Element (Permanently mounted to background load correctly) */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={isAI ? "Asset Prompt" : "Uploaded Local Asset"}
                            onLoad={() => {
                              setLoadedImages(prev => ({ ...prev, [visual.id]: true }));
                              setImageErrors(prev => ({ ...prev, [visual.id]: false }));
                            }}
                            onError={() => {
                              setImageErrors(prev => ({ ...prev, [visual.id]: true }));
                              setLoadedImages(prev => ({ ...prev, [visual.id]: false }));
                            }}
                            className={cn(
                              "w-full h-full object-cover group-hover/card:scale-101 transition-transform duration-500",
                              isLoaded && !isError ? "opacity-100" : "opacity-0 absolute pointer-events-none"
                            )}
                            loading="lazy"
                          />

                          <Badge className="absolute top-2 left-2 text-[9px] uppercase tracking-wider font-bold select-none border px-2 py-0.5 rounded-full shadow-md z-10 bg-muted/80 text-muted-foreground/90 border-border/40 font-sans">
                            {isAI ? "Visual Prompt" : "Device Upload"}
                          </Badge>

                          <button
                            type="button"
                            onClick={() => handleRemoveVisual(visual.matchText)}
                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover/card:opacity-100 transition-all shadow-md active:scale-95 z-10"
                            title="Remove visual from article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Prompt controller */}
                        <div className="p-3 bg-card flex-1 flex flex-col justify-between gap-2.5">
                          {isAI ? (
                            <div className="space-y-1">
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-muted-foreground select-none flex items-center justify-between font-sans">
                                <span>Visual Prompt Description</span>
                                <span className="text-[8.5px] font-normal lowercase font-sans text-muted-foreground flex items-center gap-1 select-none">
                                  <RefreshCw className="w-2.5 h-2.5 animate-pulse text-foreground/35" />
                                  auto-regenerates
                                </span>
                              </label>
                              <input
                                type="text"
                                value={visual.promptOrUrl}
                                onChange={(e) => {
                                  setImageErrors(prev => ({ ...prev, [visual.id]: false })); // Reset error
                                  setLoadedImages(prev => ({ ...prev, [visual.id]: false })); // Set loading spinner active immediately!
                                  handleUpdateAiPrompt(visual.matchText, visual.promptOrUrl, e.target.value);
                                }}
                                className="w-full text-xs bg-muted/60 border border-border/80 focus:border-purple-500/40 rounded-lg px-2.5 py-1.5 text-foreground leading-normal focus:outline-none focus:ring-0 select-text"
                                placeholder="Edit AI Prompt..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const tagText = `[Image: ${visual.promptOrUrl}]`;
                                  navigator.clipboard.writeText(tagText);
                                  toast.success("Image markdown copied! Paste it anywhere in your article text.", { duration: 3000 });
                                }}
                                className="mt-2.5 w-full bg-muted/60 hover:bg-neutral-800 text-foreground hover:text-white border border-border/80 rounded-lg py-1.5 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm font-sans"
                                title="Copy the markdown tag to place this image anywhere in the article text"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Image Markdown</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground/90 font-mono py-1 truncate">
                                Data size: {Math.round(imageUrl.length / 1024)} KB
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const tokenKey = visual.id.replace("dev-", "").split("-").slice(1).join("-");
                                  const tagText = `[UploadedImage: ${tokenKey}]`;
                                  navigator.clipboard.writeText(tagText);
                                  toast.success("Local image markdown copied! Paste it anywhere in your article text.", { duration: 3000 });
                                }}
                                className="w-full bg-muted/60 hover:bg-neutral-800 text-foreground hover:text-white border border-border/80 rounded-lg py-1.5 px-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm font-sans"
                                title="Copy the markdown tag to place this uploaded image anywhere in the article text"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Image Markdown</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LINKEDIN TYPE */}
        {contentType === "linkedin" && (
          <div className="max-w-[555px] mx-auto select-text">
            <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-md">
              <div className="flex items-center space-x-3 mb-4 select-none">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] flex items-center justify-center text-white font-bold text-sm">OA</div>
                <div>
                  <h4 className="font-semibold text-sm leading-none text-foreground">LinkedIn Draft</h4>
                  <span className="text-[11px] text-muted-foreground leading-none">Auto-formatting Active</span>
                </div>
              </div>
              <AutoResizeTextarea
                ref={linkedinTextareaRef}
                value={bodyText}
                onChange={handleBodyTextChange}
                onSelectionChange={handleSelection}
                placeholder="Compose a stunning LinkedIn broadcast... Include bullets, spacing and hashtags to optimize visibility."
                className="font-sans text-[15px] leading-relaxed text-foreground min-h-[300px] placeholder-muted-foreground/50 select-text"
              />
              <div className="border-t border-border pt-3 mt-4 flex items-center justify-between text-xs text-muted-foreground select-none">
                <span>{bodyText.split(/\s+/).filter(Boolean).length} words</span>
                <span>{bodyText.length} characters</span>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY TYPE */}
        {contentType === "summary" && (
          <div className="w-full max-w-2xl mx-auto select-text">
            <div className="bg-muted/15 p-5 rounded-xl border border-border/60">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 select-none">Edit Video Summary</h4>
              <AutoResizeTextarea
                ref={summaryTextareaRef}
                value={bodyText}
                onChange={handleBodyTextChange}
                onSelectionChange={handleSelection}
                placeholder="Provide a precise overview of this video..."
                className="font-sans text-sm leading-relaxed text-foreground min-h-[150px] placeholder-muted-foreground/50 select-text"
              />
            </div>
          </div>
        )}

        {/* TWITTER THREAD TYPE (TYPEFULLY STREAM) */}
        {contentType === "twitter" && (
          <div className="max-w-[550px] mx-auto select-text space-y-0">
            {tweets.map((tweet, index) => (
              <div key={index} className="relative pl-12 pb-10 group/tweet select-text">
                
                {/* Visual Connector Line (Typefully style) */}
                {index !== tweets.length - 1 && (
                  <div className="absolute left-[20px] top-[48px] bottom-0 w-[2px] bg-border group-hover/tweet:bg-foreground/20 transition-colors z-0" />
                )}

                {/* Left Connector Node */}
                <div className="absolute left-[3px] top-[4px] z-10 select-none">
                  <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center text-background font-bold border-2 border-background text-xs shadow-sm">
                    OA
                  </div>
                </div>

                {/* Tweet Input Box */}
                <div className="relative bg-card border border-border hover:border-foreground/25 focus-within:border-[var(--accent-500)] focus-within:ring-1 focus-within:ring-[var(--accent-500)]/20 p-5 rounded-2xl transition-all duration-200 shadow-sm select-text">
                  
                  {/* Floating index label */}
                  <span className="absolute top-2 right-4 text-[10.5px] font-mono text-muted-foreground select-none">
                    {index + 1} / {tweets.length}
                  </span>

                  {/* Text area */}
                  <AutoResizeTextarea
                    ref={(el) => { tweetTextareaRefs.current[index] = el; }}
                    value={tweet}
                    onChange={(e) => {
                      handleTweetTextChange(index, e.target.value);
                      lastCursorPos.current = {
                        start: e.target.selectionStart,
                        end: e.target.selectionEnd,
                      };
                    }}
                    onSelectionChange={handleSelection}
                    onFocus={() => setActiveTextareaIndex(index)}
                    placeholder={index === 0 ? "Start your viral thread here..." : "Continue typing the next tweet..."}
                    className="font-sans text-[15.5px] leading-relaxed text-foreground min-h-[90px] pr-8 placeholder-muted-foreground/50 select-text"
                  />

                  {/* Actions Area */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between select-none">
                    {/* circular counter */}
                    {renderTwitterCircle(tweet)}

                    {/* interactive options */}
                    <div className="flex items-center space-x-1">
                      {/* Delete */}
                      {tweets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-md text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                          onClick={() => handleDeleteTweet(index)}
                          title="Delete Tweet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      
                      {/* Add below */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => handleAddTweet(index)}
                        title="Add Tweet Below"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Connector Hover Split-Button */}
                {index !== tweets.length - 1 && (
                  <div className="absolute left-[9px] bottom-[-20px] z-20 opacity-0 group-hover/tweet:opacity-100 transition-opacity select-none">
                    <button
                      type="button"
                      onClick={() => handleAddTweet(index)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-[var(--accent-500)] bg-card border border-border hover:border-[var(--accent-500)]/40 rounded-full shadow-md scale-95 hover:scale-100 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Insert Tweet
                    </button>
                  </div>
                )}

              </div>
            ))}

            {/* Bottom Thread Stream Action Button */}
            <div className="flex justify-center pt-2 select-none">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-dashed border-border px-8 hover:border-[var(--accent-500)] hover:bg-[var(--accent-500)]/[0.04] transition-all hover:scale-103 group"
                onClick={() => handleAddTweet(tweets.length - 1)}
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                Add Tweet to Thread
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Status Bar — Word Count / Read Time */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-border/40 bg-muted/15 text-[10.5px] font-mono text-muted-foreground/70 select-none shrink-0">
        {contentType === "twitter" ? (
          <>
            <div className="flex items-center gap-3">
              <span>{tweets.length} tweet{tweets.length !== 1 ? "s" : ""}</span>
              <span className="text-border">·</span>
              <span>{tweets.reduce((acc, t) => acc + t.length, 0).toLocaleString()} chars total</span>
            </div>
            <div className="flex items-center gap-3">
              <span>avg {tweets.length > 0 ? Math.round(tweets.reduce((acc, t) => acc + t.length, 0) / tweets.length) : 0} chars/tweet</span>
            </div>
          </>
        ) : (
          (() => {
            const text = bodyText || "";
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            const readMins = Math.max(1, Math.ceil(words / 238));
            return (
              <>
                <div className="flex items-center gap-3">
                  <span>{words.toLocaleString()} word{words !== 1 ? "s" : ""}</span>
                  <span className="text-border">·</span>
                  <span>{chars.toLocaleString()} chars</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>~{readMins} min read</span>
                </div>
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
