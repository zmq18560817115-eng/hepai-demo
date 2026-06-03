/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 钉钉工作台 · 新人入职平台插件说明页（进入和拍前的前置展示）
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Gift,
  LayoutGrid,
  Sparkles,
  Utensils,
  Users,
  ArrowRight,
  Shield,
} from 'lucide-react';

type OnboardingPluginIntroProps = {
  onEnter: () => void;
  onReplayFirstRun?: () => void;
};

const FEATURES = [
  {
    icon: <Gift size={20} strokeWidth={2.5} />,
    title: '入职盲盒',
    desc: '8 题人格测试，生成你的入职面具与协作标签',
  },
  {
    icon: <Shield size={20} strokeWidth={2.5} />,
    title: '安全屋',
    desc: '新人情绪能量、导师带教与融入进度一屏总览',
  },
  {
    icon: <LayoutGrid size={20} strokeWidth={2.5} />,
    title: '我的工位',
    desc: '俯视桌面收集餐券、星星瓶与导师礼物贴画',
  },
  {
    icon: <Utensils size={20} strokeWidth={2.5} />,
    title: '蹭饭地图',
    desc: '园区场景选点，同场景匹配饭搭子与兴趣搭子',
  },
  {
    icon: <Users size={20} strokeWidth={2.5} />,
    title: '带教导师',
    desc: '查看主导师与项目导师，私信沟通带教事项',
  },
  {
    icon: <Sparkles size={20} strokeWidth={2.5} />,
    title: 'AI HR 助理',
    desc: '已整合《企业管理准则》与和拍带教 Skill：制度有条款引用，融入问题结合面具与导师。',
  },
];

export default function OnboardingPluginIntro({
  onEnter,
  onReplayFirstRun,
}: OnboardingPluginIntroProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#f5f6f8]">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#dde1e6] bg-white shadow-sm overflow-hidden"
        >
          <div className="h-2 bg-gradient-to-r from-[#1677ff] via-[#ff5e4d] to-[#0d9488]" />

          <div className="p-8 sm:p-10">
            <div className="flex items-start gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1677ff] to-[#4096ff] flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                和
              </div>
              <div>
                <p className="text-xs font-medium text-[#1677ff] mb-1">
                  钉钉工作台 · 企业内部应用
                </p>
                <h1 className="text-2xl font-bold text-[#171a1d] tracking-tight">
                  和拍 · 新人入职社交互助平台
                </h1>
                <p className="text-sm text-[#646a73] mt-2 leading-relaxed">
                  面向新入职员工的社交融入与带教协作插件。通过盲盒人格、安全屋、
                  场景化饭搭子匹配与工位收集玩法，帮助新人在 30 天融入期内建立连接、
                  降低孤独感，并为 HR / 导师提供可观测的融入数据。
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-3 p-4 rounded-xl bg-[#f5f6f8] border border-[#e8eaed]"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#dde1e6] flex items-center justify-center text-[#1677ff] shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#171a1d]">{f.title}</h3>
                    <p className="text-xs text-[#646a73] mt-0.5 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#e6f4ff] border border-[#91caff] px-5 py-4 mb-8">
              <p className="text-sm text-[#0958d9] font-medium">
                演示说明
              </p>
              <p className="text-xs text-[#1677ff]/90 mt-1 leading-relaxed">
                点击下方按钮进入和拍原型。支持新人 / 导师 / HR 三种身份切换，
                可体验盲盒 → 安全屋 → 蹭饭匹配 → 工位餐券收集等完整流程。
                本插件运行于钉钉电脑端工作台主内容区。
              </p>
            </div>

            <button
              type="button"
              onClick={onEnter}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#1677ff] hover:bg-[#4096ff] text-white text-sm font-bold shadow-md transition-colors min-h-[48px]"
            >
              进入和拍互助平台
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>

        <p className="text-center text-[11px] text-[#8f959e] mt-6 font-mono">
          Hepai Onboarding Plugin · v0.1 原型 · 钉钉 H5 微应用演示
          {onReplayFirstRun && (
            <>
              {' '}
              ·{' '}
              <button
                type="button"
                onClick={onReplayFirstRun}
                className="text-[#1677ff] hover:underline"
              >
                重新体验首次接入
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
