import { useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import "./index.css";
import Navbar from "./Components/Navbar.tsx";
import Sidebar from "./Components/Sidebar.tsx";
import SplashScreen from "./Pages/SplashScreen";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import Chat from "./Pages/Chat";
import Mindmap from "./Pages/Mindmap";
import Flashcards from "./Pages/Flashcards";
import Quiz from "./Pages/Quiz.tsx";

export interface Topic {
  topic: string;
  first_timestamp: number;
  last_timestamp: number;
  segment: string;
}

export interface TopicSummary {
  topic: string;
  first_timestamp: number | null;
  last_timestamp: number | null;
  transcript_summary_ar: string;
  combined_slide_summary_en: string;
  slides_with_figures: string[]; // image paths
}

export type UploadContext = {
  setUploadStatus: (status: string | undefined) => void;
  setUploadMessage: (message: string | undefined) => void;
  setUploadProgress: (progress: number | null | undefined) => void;
  setVideoUrl: (url: string | null) => void;
  setTopics: (topics: Topic[]) => void;
  setTopicSummaries: (summaries: TopicSummary[]) => void;
  onTopicClick: (topic: Topic, index: number) => void;
  activeTopicIndex: number | null;
  seekTo: (startSec: number, endSec?: number) => void;
};

function WithNav() {
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [uploadStatus, setUploadStatus]       = useState<string | undefined>();
  const [uploadMessage, setUploadMessage]     = useState<string | undefined>();
  const [uploadProgress, setUploadProgress]   = useState<number | null | undefined>();
  const [videoUrl, setVideoUrl]               = useState<string | null>(null);
  const [topics, setTopics]                   = useState<Topic[]>([]);
  const [topicSummaries, setTopicSummaries]   = useState<TopicSummary[]>([]);
  const [activeTopicIndex, setActiveTopicIndex] = useState<number | null>(null);
  const [highlightEnd, setHighlightEnd]       = useState<number | null>(null);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seekTo = (startSec: number, endSec?: number) => {
    const video = videoRef.current;
    if (!video) return;
    setSidebarOpen(true);
    video.currentTime = startSec;
    video.play();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHighlightEnd(endSec ?? null);
    if (endSec !== undefined) {
      intervalRef.current = setInterval(() => {
        if (video.currentTime >= endSec) {
          video.pause();
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setHighlightEnd(null);
        }
      }, 300);
    }
  };

  const onTopicClick = (_topic: Topic, index: number) => {
    setActiveTopicIndex((prev) => (prev === index ? null : index));
  };

  return (
    <>
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        uploadStatus={uploadStatus}
        uploadMessage={uploadMessage}
        uploadProgress={uploadProgress}
        videoUrl={videoUrl}
        videoRef={videoRef}
        topics={topics}
        topicSummaries={topicSummaries}
        onTopicClick={onTopicClick}
        activeTopicIndex={activeTopicIndex}
        seekTo={seekTo}
        highlightEnd={highlightEnd}
      />
      <div className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Outlet
          context={
            {
              setUploadStatus,
              setUploadMessage,
              setUploadProgress,
              setVideoUrl,
              setTopics,
              setTopicSummaries,
              onTopicClick,
              activeTopicIndex,
              seekTo,
            } satisfies UploadContext
          }
        />
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route element={<WithNav />}>
          <Route path="/login"     element={<Login />} />
          <Route path="/signup"    element={<SignUp />} />
          <Route path="/chat"      element={<Chat />} />
          <Route path="/mindmap"   element={<Mindmap />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/Quiz"      element={<Quiz />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;