import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, MonitorPlay, Settings, Share2, HelpCircle, Languages } from 'lucide-react';
import './index.css';
import './side-panel.css';
import StreamGrid from './components/StreamGrid';
import StreamSidePanel from './components/StreamSidePanel';
import AddStreamModal from './components/AddStreamModal';
import ShareModal from './components/ShareModal';
import HelpModal from './components/HelpModal';
import SettingsModal from './components/SettingsModal';
import type { Stream } from './types';
import { t } from './i18n';
import type { Locale } from './i18n';
import { useStreamHistory } from './hooks/useStreamHistory';
import type { HistoryEntry } from './hooks/useStreamHistory';
import { resolveYouTubeChannel } from './utils/resolveChannelId';

const HEADER_H = 36;
const HIDE_THRESHOLD = HEADER_H * 5;

function App() {
  const [locale, setLocale] = useState<Locale>('ja');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const headerVisibleRef = useRef(false);
  const { history, addToHistory, removeFromHistory } = useStreamHistory();

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

  const handleLocaleChange = useCallback(() => {
    const next: Locale = locale === 'ja' ? 'en' : 'ja';
    setLocale(next);
    localStorage.setItem('locale', next);
  }, [locale]);

  const handleAddStream = (stream: Stream) => {
    setStreams(prev => [...prev, stream]);
    addToHistory(stream);
  };

  const handleAddFromHistory = useCallback(async (entry: HistoryEntry) => {
    let sourceId = entry.sourceId;
    let inputType = entry.inputType;
    let isLive: boolean | undefined;
    if (entry.type === 'youtube' && entry.inputType === 'channel') {
      try {
        const result = await resolveYouTubeChannel(entry.sourceId, true);
        isLive = result.isLive;
        sourceId = result.isLive ? result.videoId : entry.sourceId;
        inputType = result.isLive ? 'video' : 'channel';
      } catch (err) {
        console.warn('[App] history add resolve failed:', err);
      }
    }
    const stream: Stream = {
      id: crypto.randomUUID(),
      type: entry.type,
      title: entry.title,
      sourceId,
      inputType,
      isLive,
      channelHandle: entry.type === 'youtube' && entry.inputType === 'channel' ? entry.sourceId : undefined,
    };
    setStreams(prev => [...prev, stream]);
  }, []);

  const handleToggleHidden = useCallback((id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s));
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
            const { videoId, isLive } = await resolveYouTubeChannel(handle, true);
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

      <main className="app-main">
        <StreamSidePanel
          streams={streams}
          onToggleHidden={handleToggleHidden}
          history={history}
          onAddFromHistory={handleAddFromHistory}
          onRemoveFromHistory={removeFromHistory}
          locale={locale}
        />
        <StreamGrid
          streams={streams.filter(s => !s.hidden)}
          setStreams={setStreams}
          isArchiveMode={false}
          globalTime={0}
          locale={locale}
          onHide={handleToggleHidden}
          onUpdateSourceId={handleUpdateSourceId}
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
        />
      )}
    </div>
  );
}

export default App;
