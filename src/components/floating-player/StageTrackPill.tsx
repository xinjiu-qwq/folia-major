import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { getSizedCoverUrl } from '../../utils/coverUrl';

// src/components/floating-player/StageTrackPill.tsx
// 歌词页（stage）左下角的曲目信息卡：左侧封面 + 右侧歌名/歌手。
// 不携带操作按钮——切歌/队列/时间轴都在底部中央控制条里，这里只做信息展示；
// 点击整卡导航回歌词页（与旧的胶囊主体行为一致）。
// 显示模式：auto=显示 timeoutSec 秒后淡出（换歌重新计时），always=常驻，never=不渲染。

export type StageTrackPillMode = 'auto' | 'always' | 'never';

export interface StageTrackPillProps {
    title: string;
    artist: string | null;
    coverUrl: string | null;
    mode: StageTrackPillMode;
    timeoutSec: number;
    isDaylight: boolean;
    controlsDisabled?: boolean;
    /** 点击卡片行为：player 视图打开右侧面板（P1），home 视图导航到歌词页 */
    onOpenPlayerPanel: () => void;
    onNavigateToPlayer: () => void;
    primaryColor?: string;
    secondaryColor?: string;
}

const StageTrackPill: React.FC<StageTrackPillProps> = ({
    title,
    artist,
    coverUrl,
    mode,
    timeoutSec,
    isDaylight,
    controlsDisabled = false,
    onOpenPlayerPanel,
    onNavigateToPlayer,
    primaryColor = 'var(--text-primary)',
    secondaryColor = 'var(--text-secondary)',
}) => {
    const glassClass = isDaylight
        ? 'bg-white/60 border-white/20 shadow-xl'
        : 'bg-black/40 border-white/5 shadow-2xl';
    const resolvedCoverUrl = getSizedCoverUrl(coverUrl, 256) || undefined;

    // auto 模式：换歌时重置计时（key 随 title 变化触发 effect 重跑）
    const [visible, setVisible] = useState(mode !== 'never');
    const hideTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        if (mode === 'never') {
            setVisible(false);
            return;
        }

        if (mode === 'always') {
            setVisible(true);
            return;
        }

        setVisible(true);
        const timeoutMs = Math.max(3, Math.min(60, Math.round(timeoutSec))) * 1000;
        hideTimeoutRef.current = window.setTimeout(() => {
            hideTimeoutRef.current = null;
            setVisible(false);
        }, timeoutMs);

        return () => {
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };
    }, [mode, timeoutSec, title]);

    if (mode === 'never') {
        return null;
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="pointer-events-auto absolute bottom-8 left-4 md:left-8 z-[60]"
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    <motion.button
                        type="button"
                        layout
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!controlsDisabled) {
                                onOpenPlayerPanel();
                            }
                        }}
                        className={`group/card flex h-[72px] w-fit max-w-[calc(100vw-120px)] items-center gap-3.5 overflow-hidden rounded-full border py-3 pl-3 pr-6 text-left backdrop-blur-xl transition-colors duration-300 ${glassClass}`}
                        style={{ cursor: controlsDisabled ? 'default' : 'pointer' }}
                        title={title}
                        aria-label={title}
                    >
                        {/* 封面：48px rounded-2xl，与右侧面板内专辑封面同形状 */}
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-black/20">
                            {resolvedCoverUrl ? (
                                <img
                                    src={resolvedCoverUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    draggable={false}
                                    loading="lazy"
                                />
                            ) : (
                                <div
                                    className="flex h-full w-full items-center justify-center"
                                    style={{ color: secondaryColor }}
                                >
                                    <Music2 size={20} className="opacity-60" />
                                </div>
                            )}
                        </div>

                        {/* 歌名 + 歌手 */}
                        <div className="min-w-0">
                            <div className="truncate text-sm font-bold leading-[18px] select-none" style={{ color: primaryColor }}>
                                {title}
                            </div>
                            {artist ? (
                                <div className="truncate text-xs leading-4 select-none opacity-60" style={{ color: secondaryColor }}>
                                    {artist}
                                </div>
                            ) : null}
                        </div>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StageTrackPill;
