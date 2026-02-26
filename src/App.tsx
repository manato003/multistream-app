import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, MonitorPlay, Settings, Share2, HelpCircle, Languages, MessageSquare } from 'lucide-react';
import './index.css';
import './side-panel.css';
import StreamGrid from './components/StreamGrid';
import StreamSidePanel from './components/StreamSidePanel';
import ChatSidePanel from './components/ChatSidePanel';
import AddStreamModal from './components/AddStreamModal';
import ShareModal from './components/ShareModal';
import HelpModal from './components/HelpModal';
import SettingsModal from './components/SettingsModal';
import type { Stream } from './types';
import { t } from './i18n';
import type { Locale } from './i18n';
import { useStreamHistory } from './hooks/useStreamHistory';
import type { HistoryEntry } from './hooks/useStreamHistory';
import { useSettings } from './hooks/useSettings';
import { resolveYouTubeChannel, resolveVideoToChannel } from './utils/resolveChannelId';

const HEADER_H = 36;
const HIDE_THRESHOLD = HEADER_H * 5;

function App() {
  const [locale, setLocale] = useState<Locale>('ja');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(() => localStorage.getItem('chatPanelOpen') === 'true');
  const [settings, updateSetting] = useSettings();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const headerVisibleRef = useRef(false);
  const { history, addToHistory, removeFromHistory, reorderHistory } = useStreamHistory();

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (headerVisibleRef.current && e.clientY > HIDE_THRESHOLD) {
        headerVisibleRef.current = false;
        setHeaderVisible(false);
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  const showHeader = useCallback(() => {
    headerVisibleRef.current = true;
    setHeaderVisible(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale) setLocale(savedLocale);
    const savedStreams = localStorage.getItem('activeStreams');
    if (savedStreams) {
      try { setStreams(JSON.parse(savedStreams)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('activeStreams', JSON.stringify(streams));
  }, [streams]);

  useEffect(() => {
    localStorage.setItem('chatPanelOpen', String(isChatOpen));
  }, [isChatOpen]);

  const handleLocaleChange = useCallback(() => {
    const next: Locale = locale === 'ja' ? 'en' : 'ja';
    setLocale(next);
    localStorage.setItem('locale', next);
  }, [locale]);

  const handleAddStream = async (stream: Stream) => {
    setStreams(prev => [...prev, stream]);
    addToHistory(stream);

    // ── YouTube channel: resolve live video ID in background ────────────
    if (stream.type === 'youtube' && stream.inputType === 'channel' && stream.channelHandle) {
      try {
        const { videoId, isLive } = await resolveYouTubeChannel(stream.channelHandle);
        setStreams(prev => prev.map(s => s.id === stream.id ? {
          ...s,
          sourceId: isLive ? videoId : stream.channelHandle!,
          inputType: isLive ? 'video' : 'channel',
          isLive,
          isResolving: false,
        } : s));
      } catch (err) {
        console.warn('[App] handleAddStream channel resolve failed:', err);
        setStreams(prev => prev.map(s => s.id === stream.id ? { ...s, isResolving: false } : s));
      }
      return;
    }

    // ── YouTube video URL: resolve channel handle in background (title update) ──
    if (stream.type === 'youtube' && stream.inputType === 'video' && !stream.channelHandle) {
      try {
        const handle = await resolveVideoToChannel(stream.sourceId);
        if (handle) {
          setStreams(prev => prev.map(s => s.id === stream.id ? {
            ...s,
            title: `YouTube: @${handle}`,
            channelHandle: handle,
          } : s));
        }
      } catch (err) {
        console.warn('[App] handleAddStream video handle resolve failed:', err);
      }
    }
  };

  const handleAddFromHistory = useCallback(async (entry: HistoryEntry) => {
    const streamId = crypto.randomUUID();

    if (entry.type === 'youtube' && entry.inputType === 'channel') {
      // 即時追加（ローディング状態）→ バックグラウンドで解決
      setStreams(prev => [...prev, {
        id: streamId,
        type: 'youtube',
        title: entry.title,
        sourceId: entry.sourceId,
        inputType: 'channel',
        channelHandle: entry.sourceId,
        isResolving: true,
      }]);
      try {
        const result = await resolveYouTubeChannel(entry.sourceId);
        setStreams(prev => prev.map(s => s.id === streamId ? {
          ...s,
          sourceId: result.isLive ? result.videoId : entry.sourceId,
          inputType: result.isLive ? 'video' : 'channel',
          isLive: result.isLive,
          isResolving: false,
        } : s));
      } catch (err) {
        console.warn('[App] history add resolve failed:', err);
        setStreams(prev => prev.map(s => s.id === streamId ? { ...s, isResolving: false } : s));
      }
    } else {
      setStreams(prev => [...prev, {
        id: streamId,
        type: entry.type,
        title: entry.title,
        sourceId: entry.sourceId,
        inputType: entry.inputType,
      }]);
    }
  }, []);

  const handleReorder = useCallback((fromId: string, toId: string) => {
    setStreams(prev => {
      const arr = [...prev];
      const fi = arr.findIndex(s => s.id === fromId);
      const ti = arr.findIndex(s => s.id === toId);
      if (fi === -1 || ti === -1) return prev;
      [arr[fi], arr[ti]] = [arr[ti], arr[fi]];
      return arr;
    });
  }, []);

  const handleToggleHidden = useCallback((id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s));
  }, []);

  const handleRemoveStream = useCallback((id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleUpdateSourceId = useCallback((id: string, newSourceId: string, isLive: boolean) => {
    setStreams(prev => prev.map(s =>
      s.id === id
        ? { ...s, sourceId: isLive ? newSourceId : s.channelHandle ?? s.sourceId, inputType: isLive ? 'video' : 'channel', isLive }
        : s
    ));
  }, []);

  // 起動時：全YouTubeチャンネル枠のvideo IDをバックグラウンドで再取得
  useEffect(() => {
    const refreshAll = async () => {
      setStreams(prev => {
        const youtubeChannels = prev.filter(s => s.type === 'youtube' && s.channelHandle);
        if (youtubeChannels.length === 0) return prev;
        youtubeChannels.forEach(async (stream) => {
          try {
            const handle = stream.channelHandle!;
            const { videoId, isLive } = await resolveYouTubeChannel(handle);
            setStreams(cur => cur.map(s =>
              s.id === stream.id
                ? { ...s, sourceId: isLive ? videoId : handle, inputType: isLive ? 'video' : 'channel', isLive }
                : s
            ));
          } catch (err) {
            console.warn(`[App] startup refresh failed for ${stream.channelHandle}:`, err);
          }
        });
        return prev;
      });
    };
    refreshAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyConfig = (newStreams: Stream[]) => {
    setStreams(newStreams);
    setIsShareModalOpen(false);
  };

  const visibleStreams = useMemo(() => streams.filter(s => !s.hidden), [streams]);

  return (
    <div className="app-root">
      <div className="header-trigger" onMouseEnter={showHeader} />

      <header
        className={`app-header ${headerVisible ? 'visible' : ''}`}
        onMouseEnter={showHeader}
      >
        {/* Left: title */}
        <div className="app-title">
          <MonitorPlay size={16} color="var(--accent)" />
          <span>{t(locale, 'appTitle')}</span>
        </div>

        {/* Center: add stream */}
        <div className="header-center">
          <button className="header-add-btn-center" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={15} />
            <span>{t(locale, 'addStream')}</span>
          </button>
        </div>

        {/* Right: controls */}
        <div className="header-controls">
          <button
            className={`header-btn${isChatOpen ? ' active' : ''}`}
            onClick={() => setIsChatOpen(v => !v)}
            title={locale === 'ja' ? 'コメント' : 'Chat'}
          >
            <MessageSquare size={14} />
          </button>

          <button className="header-btn" onClick={() => setIsShareModalOpen(true)} title={t(locale, 'shareLayout')}>
            <Share2 size={14} />
          </button>

          <button className="header-btn" onClick={() => setIsHelpModalOpen(true)} title={t(locale, 'help')}>
            <HelpCircle size={14} />
          </button>

          <button className="header-btn" onClick={handleLocaleChange} title={t(locale, 'language')}>
            <Languages size={14} />
            <span>{locale === 'ja' ? 'EN' : 'JA'}</span>
          </button>

          <button
            className={`header-btn ${isSettingsModalOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsModalOpen(true)}
            title={locale === 'ja' ? '設定' : 'Settings'}
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      <main className={`app-main${isChatOpen ? ' chat-open' : ''}${settings.panelLayout === 'swapped' ? ' panels-swapped' : ''}`}>
        <StreamSidePanel
          streams={streams}
          onToggleHidden={handleToggleHidden}
          onRemove={handleRemoveStream}
          onReorder={handleReorder}
          history={history}
          onAddFromHistory={handleAddFromHistory}
          onRemoveFromHistory={removeFromHistory}
          onReorderHistory={reorderHistory}
          locale={locale}
          swapped={settings.panelLayout === 'swapped'}
        />
        <StreamGrid
          streams={visibleStreams}
          setStreams={setStreams}
          isArchiveMode={false}
          globalTime={0}
          locale={locale}
          onHide={handleToggleHidden}
          onUpdateSourceId={handleUpdateSourceId}
        />
        <ChatSidePanel
            streams={streams}
            locale={locale}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            swapped={settings.panelLayout === 'swapped'}
          />
      </main>

      {isAddModalOpen && (
        <AddStreamModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddStream}
          locale={locale}
          addedStreams={streams}
          onRemove={(id) => setStreams(prev => prev.filter(s => s.id !== id))}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          onClose={() => setIsShareModalOpen(false)}
          streams={streams}
          onApply={handleApplyConfig}
          locale={locale}
        />
      )}

      {isHelpModalOpen && (
        <HelpModal
          onClose={() => setIsHelpModalOpen(false)}
          locale={locale}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          locale={locale}
          settings={settings}
          onUpdateSetting={updateSetting}
        />
      )}
    </div>
  );
}

export default App;
