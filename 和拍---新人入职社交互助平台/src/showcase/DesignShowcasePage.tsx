/**
 * 和拍 · 设计展示（左侧导航 + 右侧实时可交互演示）
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Monitor,
  Smartphone,
  Play,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import type { ShowcaseJump } from '../utils/showcaseJump';
import { setShowcaseJump } from '../utils/showcaseJump';

type DeviceMode = 'desktop' | 'mobile';

type Scene = {
  id: string;
  group: string;
  title: string;
  hint: string;
  steps: string[];
  jump?: ShowcaseJump;
};

const SCENES: Scene[] = [
  {
    id: 'shell',
    group: '钉钉外壳',
    title: 'PC 消息与工作台',
    hint: '演示钉钉电脑端外壳，左侧可切换各导航占位。',
    steps: ['打开后即为消息页', '左侧点击「文档 / 工作台 / 日历」等查看占位'],
    jump: undefined,
  },
  {
    id: 'role',
    group: '接入流程',
    title: '身份选择',
    hint: '三门入口：新人 / 导师 / HR。',
    steps: ['左侧点「和 新人入职」', '选择「局外新人 / 资深导师 / 行政/HR」'],
    jump: undefined,
  },
  {
    id: 'first-flow',
    group: '接入流程',
    title: '新人首次接入（E00001）',
    hint: '大礼包 → 认识团队 → 8 题盲盒 → 安全屋。',
    steps: [
      '工号 E00001 / 密码 123456',
      '开心收下礼包 → 查看团队 → 继续加入团队',
      '完成 8 题人格测试 → 进入安全屋',
    ],
    jump: { role: 'newcomer', employeeId: 'E00001', firstTimeFlow: true },
  },
  {
    id: 'workplace',
    group: '新人模块',
    title: '安全屋（老员工 E00008）',
    hint: '面具、能量条、各功能入口。',
    steps: ['顶栏可切换：工位 / 蹭饭 / 导师', '右下角 AI HR 悬浮入口'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'workplace' },
  },
  {
    id: 'lunch',
    group: '新人模块',
    title: '蹭饭地图 · 午餐匹配',
    hint: '寻求饭搭子 → 匹配中 → 成功 → 路线。',
    steps: ['顶栏点「蹭饭地图」', '选场景后点「寻求饭搭子」'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'lunch' },
  },
  {
    id: 'interest',
    group: '新人模块',
    title: '兴趣搭子匹配',
    hint: '在蹭饭地图内进入兴趣匹配。',
    steps: ['蹭饭地图 →「寻找兴趣搭子」', '寻求兴趣搭子并等待匹配'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'interest' },
  },
  {
    id: 'desk',
    group: '新人模块',
    title: '我的工位',
    hint: '贴画桌面、餐券与星星收集。',
    steps: ['顶栏点「我的工位」'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'my_desk' },
  },
  {
    id: 'mentors',
    group: '新人模块',
    title: '带教导师 · 私信',
    hint: '导师列表与对话页。',
    steps: ['顶栏点「带教导师」', '点击导师卡片进入对话'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'mentors' },
  },
  {
    id: 'flash',
    group: '新人模块',
    title: '闪光星罐',
    hint: '记录今日高光，折纸星星入罐。',
    steps: ['安全屋 →「进入星罐」', '填写今日闪光并保存'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'flash_star' },
  },
  {
    id: 'aihr',
    group: '新人模块',
    title: '企业 AI HR',
    hint: '制度问答 + 融入建议，读取 SQLite 上下文。',
    steps: ['点击右下角 AI HR', '选择快捷问题或输入咨询'],
    jump: { role: 'newcomer', employeeId: 'E00008', newcomerView: 'ai_hr' },
  },
  {
    id: 'mentor-hub',
    group: '导师模块',
    title: '导师工作台',
    hint: '分配新人、面具标签、风险与对话。',
    steps: ['身份选「我是导师」', 'M00001 / 123456 登录', '点击新人卡片对话'],
    jump: { role: 'mentor', employeeId: 'M00001' },
  },
  {
    id: 'hr-dash',
    group: 'HR 模块',
    title: 'HR 数智看板',
    hint: '融入 KPI、情绪趋势、入职登记。',
    steps: ['身份选「我是 HR」', 'HR0001 / 123456 登录', '切换「运营看板 / 入职准备」'],
    jump: { role: 'hr', employeeId: 'HR0001' },
  },
  {
    id: 'pilot',
    group: '手机 H5',
    title: '试点单页（无外壳）',
    hint: '云部署 / 真钉钉同款，390 宽屏。',
    steps: ['切换上方为「手机预览」', '或新标签打开 /?embed=1'],
    jump: undefined,
  },
];

const GROUPS = [...new Set(SCENES.map((s) => s.group))];

export default function DesignShowcasePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [activeId, setActiveId] = useState(SCENES[0].id);
  const [iframeKey, setIframeKey] = useState(0);

  const active = useMemo(
    () => SCENES.find((s) => s.id === activeId) ?? SCENES[0],
    [activeId],
  );

  const demoSrc = useMemo(() => {
    const embed = device === 'mobile' ? '&embed=1' : '';
    return `${window.location.origin}/?app=1${embed}`;
  }, [device, iframeKey]);

  const reloadDemo = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const runJump = useCallback(
    (jump?: ShowcaseJump) => {
      if (jump) {
        if (jump.newcomerView) {
          try {
            sessionStorage.setItem(
              'hepai_showcase_view',
              jump.newcomerView,
            );
          } catch {
            /* ignore */
          }
        }
        setShowcaseJump(jump);
      } else {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      }
      reloadDemo();
    },
    [reloadDemo],
  );

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5]">
      <header className="shrink-0 h-14 px-4 flex items-center justify-between border-b border-[#dde1e6] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#dde1e6] flex items-center justify-center text-[#ff5e4d] font-black text-sm">
            和
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#171a1d]">
              和拍 · 设计展示
            </h1>
            <p className="text-[10px] text-[#8f959e] font-mono">
              左侧选场景 · 右侧实时交互 · Mock 演示
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#dde1e6] p-0.5 bg-[#f5f6f8]">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                device === 'desktop'
                  ? 'bg-white text-[#1677ff] shadow-sm'
                  : 'text-[#646a73]'
              }`}
            >
              <Monitor size={14} />
              电脑端
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                device === 'mobile'
                  ? 'bg-white text-[#1677ff] shadow-sm'
                  : 'text-[#646a73]'
              }`}
            >
              <Smartphone size={14} />
              手机 H5
            </button>
          </div>
          <button
            type="button"
            onClick={reloadDemo}
            className="neo-button text-[11px] flex items-center gap-1 px-3 py-2"
          >
            <RotateCcw size={14} />
            重置演示
          </button>
          <a
            href="/?app=1"
            target="_blank"
            rel="noreferrer"
            className="neo-button-primary text-[11px] flex items-center gap-1 px-3 py-2"
          >
            <ExternalLink size={14} />
            全屏演示
          </a>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-[280px] shrink-0 border-r border-[#dde1e6] bg-white overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group} className="py-2">
              <p className="px-4 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8f959e]">
                {group}
              </p>
              {SCENES.filter((s) => s.group === group).map((scene) => {
                const selected = scene.id === activeId;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setActiveId(scene.id)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors border-l-2 ${
                      selected
                        ? 'border-[#1677ff] bg-[#e6f4ff] text-[#0958d9] font-medium'
                        : 'border-transparent text-[#171a1d] hover:bg-[#f5f6f8]'
                    }`}
                  >
                    {scene.title}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <section className="w-[320px] shrink-0 border-r border-[#dde1e6] bg-[#fafafa] overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-mono text-[#1677ff] uppercase tracking-wide">
              {active.group}
            </p>
            <h2 className="text-lg font-semibold text-[#171a1d] mt-1">
              {active.title}
            </h2>
            <p className="text-xs text-[#646a73] mt-2 leading-relaxed">
              {active.hint}
            </p>
          </div>

          <div className="neo-card p-4 space-y-2">
            <p className="text-[10px] font-medium text-[#8f959e] uppercase tracking-wide">
              操作路径
            </p>
            <ol className="space-y-2">
              {active.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-2 text-xs text-[#171a1d] leading-relaxed"
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#e6f4ff] text-[#1677ff] text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <button
            type="button"
            onClick={() => runJump(active.jump)}
            className="neo-button-primary w-full py-3 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Play size={16} />
            {active.jump ? '一键进入此场景' : '刷新演示区'}
            <ChevronRight size={16} />
          </button>

          <div className="text-[10px] text-[#8f959e] font-mono space-y-1 pt-2 border-t border-[#e8eaed]">
            <p>E00001 · 首次完整流程</p>
            <p>E00008 · 老员工功能页</p>
            <p>M00001 / HR0001 · 密码 123456</p>
          </div>
        </section>

        <main className="flex-1 min-w-0 flex items-center justify-center p-4 bg-[#e8eaed] overflow-hidden">
          <div
            className={`bg-white rounded-2xl border border-[#dde1e6] shadow-[0_8px_32px_rgb(0_0_0/0.12)] overflow-hidden transition-all duration-300 ${
              device === 'mobile'
                ? 'w-[390px] h-[844px] rounded-[2rem]'
                : 'w-full h-full max-w-none rounded-xl'
            }`}
          >
            <iframe
              ref={iframeRef}
              key={`${iframeKey}-${device}`}
              title="和拍实时演示"
              src={demoSrc}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
