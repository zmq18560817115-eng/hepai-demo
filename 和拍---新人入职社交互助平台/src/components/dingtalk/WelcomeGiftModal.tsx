/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 首次接入 · 入职大礼包弹层
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, X } from 'lucide-react';

type WelcomeGiftModalProps = {
  open: boolean;
  onReceive: () => void;
  onDismiss?: () => void;
};

export default function WelcomeGiftModal({
  open,
  onReceive,
  onDismiss,
}: WelcomeGiftModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-gift-title"
        >
          <motion.div
            className="absolute inset-0 bg-[#1e2433]/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* 飘动光点 */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#ffd666] pointer-events-none"
              style={{
                left: `${15 + (i * 7) % 70}%`,
                top: `${20 + (i * 11) % 60}%`,
              }}
              animate={{
                y: [0, -24, 0],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + (i % 3) * 0.4,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}

          <motion.div
            className="relative w-full max-w-md bg-white rounded-3xl border-2 border-[#1b2838] shadow-[8px_8px_0_#1b2838] overflow-hidden"
            initial={{ scale: 0.85, y: 40, rotate: -2 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div className="h-2 bg-gradient-to-r from-[#ff5e4d] via-[#ffd666] to-[#1677ff]" />

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-[#8f959e] hover:bg-[#f5f6f8]"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            )}

            <div className="px-8 pt-10 pb-8 text-center">
              <motion.div
                className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-[#ff5e4d] to-[#ff8a7a] border-[3px] border-[#1b2838] flex items-center justify-center shadow-[5px_5px_0_#1b2838] mb-6"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Gift size={52} className="text-white" strokeWidth={2.5} />
              </motion.div>

              <p className="text-xs font-bold text-[#1677ff] mb-2 flex items-center justify-center gap-1">
                <Sparkles size={14} />
                欢迎加入公司
              </p>
              <h2
                id="welcome-gift-title"
                className="text-2xl font-bold text-[#171a1d] mb-2"
              >
                入职大礼包
              </h2>
              <p className="text-sm text-[#646a73] leading-relaxed mb-8">
                恭喜你完成企业账号首次接入！
                <br />
                和拍为你准备了融入礼包：安全屋指引、工位贴画与饭搭子餐券，助你快速认识团队。
              </p>

              <motion.button
                type="button"
                onClick={onReceive}
                className="w-full py-3.5 rounded-xl bg-[#ff5e4d] hover:bg-[#ff7a6b] text-white font-bold text-sm border-2 border-[#1b2838] shadow-[4px_4px_0_#1b2838] min-h-[48px]"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                开心收下
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
